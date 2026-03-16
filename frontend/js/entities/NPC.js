/**
 * 寻道人 - NPC实体类
 * 圆柱体作为NPC模型（颜色区分）
 */

import { getNPC } from '../data/npcs.js';

export default class NPC {
    constructor(npcId) {
        const config = getNPC(npcId);
        if (!config) {
            throw new Error(`Unknown NPC: ${npcId}`);
        }
        
        // 复制配置
        this.id = npcId;
        this.name = config.name;
        this.title = config.title;
        this.color = config.color;
        this.size = config.size || 1.0;
        this.position = { ...config.position };
        this.glow = config.glow || false;
        this.type = config.type;
        this.dialogs = config.dialogs;
        this.shopItems = config.shopItems || [];
        this.hidden = config.hidden || false;
        
        // 3D对象
        this.mesh = null;
        this.glowMesh = null;
        
        // 交互状态
        this.isInteracting = false;
        this.currentDialog = 'default';
        
        // 游荡行为
        this.isWandering = config.isWandering || false;
        this.wanderArea = config.wanderArea || { radius: 3 };
        this.wanderTarget = null;
        this.wanderTimer = 0;
        this.moveSpeed = config.moveSpeed || 1.0;
    }

    /**
     * 创建3D模型
     */
    createMesh() {
        // 创建圆柱体
        const geometry = new THREE.CylinderGeometry(
            0.4 * this.size, 
            0.4 * this.size, 
            1.6 * this.size, 
            16
        );
        const material = new THREE.MeshLambertMaterial({ 
            color: this.color,
            emissive: new THREE.Color(this.color).multiplyScalar(0.3)
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            this.position.x, 
            this.position.y + 0.8 * this.size, 
            this.position.z
        );
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { type: 'npc', entity: this };
        
        // 创建光环效果（如果需要）
        if (this.glow) {
            const glowGeometry = new THREE.RingGeometry(0.6, 0.8, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            
            this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            this.glowMesh.position.set(this.position.x, 0.05, this.position.z);
            this.glowMesh.rotation.x = -Math.PI / 2;
        }
        
        return this.mesh;
    }

    /**
     * 更新（动画等）
     */
    update(deltaTime) {
        // 光环旋转动画
        if (this.glowMesh) {
            this.glowMesh.rotation.z += deltaTime * 0.5;
        }
        
        // 游荡行为
        if (this.isWandering) {
            this.updateWandering(deltaTime);
        }
    }
    
    /**
     * 更新游荡行为
     */
    updateWandering(deltaTime) {
        this.wanderTimer -= deltaTime;
        
        if (this.wanderTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.wanderArea.radius;
            let targetX = this.position.x + Math.cos(angle) * distance;
            let targetZ = this.position.z + Math.sin(angle) * distance;
            
            if (this.wanderArea.minX !== undefined) {
                targetX = Math.max(this.wanderArea.minX, Math.min(this.wanderArea.maxX, targetX));
            }
            if (this.wanderArea.minZ !== undefined) {
                targetZ = Math.max(this.wanderArea.minZ, Math.min(this.wanderArea.maxZ, targetZ));
            }
            
            this.wanderTarget = { x: targetX, z: targetZ };
            this.wanderTimer = 2 + Math.random() * 3;
        }
        
        if (this.wanderTarget && this.mesh) {
            const dx = this.wanderTarget.x - this.position.x;
            const dz = this.wanderTarget.z - this.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0.1) {
                const moveX = (dx / distance) * this.moveSpeed * deltaTime;
                const moveZ = (dz / distance) * this.moveSpeed * deltaTime;
                
                this.position.x += moveX;
                this.position.z += moveZ;
                
                if (this.wanderArea.minX !== undefined) {
                    this.position.x = Math.max(this.wanderArea.minX, Math.min(this.wanderArea.maxX, this.position.x));
                    this.position.z = Math.max(this.wanderArea.minZ, Math.min(this.wanderArea.maxZ, this.position.z));
                }
                
                this.mesh.position.x = this.position.x;
                this.mesh.position.z = this.position.z;
                
                if (this.glowMesh) {
                    this.glowMesh.position.x = this.position.x;
                    this.glowMesh.position.z = this.position.z;
                }
                
                const angle = Math.atan2(dx, dz);
                this.mesh.rotation.y = angle;
            }
        }
    }

    /**
     * 获取当前对话
     */
    getDialog(dialogId = null, player = null) {
        const id = dialogId || this.currentDialog;
        let dialog = this.dialogs[id];
        
        if (!dialog) {
            dialog = this.dialogs.default;
        }
        
        // 过滤选项（根据条件）
        if (dialog.options && player) {
            dialog = {
                ...dialog,
                options: dialog.options.filter(option => {
                    if (!option.condition) return true;
                    
                    const cond = option.condition;
                    
                    if (cond.minLevel && player.level < cond.minLevel) return false;
                    if (cond.noClass && player.classId) return false;
                    if (cond.hasClass && !player.classId) return false;
                    
                    return true;
                })
            };
        }
        
        return dialog;
    }

    /**
     * 设置当前对话
     */
    setDialog(dialogId) {
        this.currentDialog = dialogId;
    }

    /**
     * 获取与玩家的距离
     */
    getDistanceTo(playerPosition) {
        const dx = playerPosition.x - this.position.x;
        const dz = playerPosition.z - this.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 检查是否可交互
     */
    canInteract(playerPosition, maxDistance = 3) {
        return this.getDistanceTo(playerPosition) <= maxDistance;
    }

    /**
     * 面向玩家
     */
    lookAtPlayer(playerPosition) {
        const dx = playerPosition.x - this.position.x;
        const dz = playerPosition.z - this.position.z;
        const angle = Math.atan2(dx, dz);
        
        if (this.mesh) {
            this.mesh.rotation.y = angle;
        }
    }
}
