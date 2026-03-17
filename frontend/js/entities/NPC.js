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
    }

    /**
     * 创建3D模型
     */
    createMesh() {
        // 创建人物模型组（包含头、身体、四肢）
        this.mesh = new THREE.Group();
        
        // 身体材质
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: this.color,
            emissive: new THREE.Color(this.color).multiplyScalar(0.3)
        });
        
        // 皮肤材质
        const skinMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffdbac,
            emissive: 0x332211
        });
        
        const scale = this.size;
        
        // 头部（球体）
        const headGeometry = new THREE.SphereGeometry(0.25 * scale, 16, 16);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.y = 1.75 * scale;
        head.castShadow = true;
        this.mesh.add(head);
        
        // 身体（圆柱体）- 缩短
        const bodyGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.35 * scale, 0.6 * scale, 12);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.2 * scale;
        body.castShadow = true;
        this.mesh.add(body);
        
        // 左臂
        const armGeometry = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.5 * scale, 8);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.4 * scale, 1.0 * scale, 0);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        
        // 右臂
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.4 * scale, 1.0 * scale, 0);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        
        // 左腿 - 加长
        const legGeometry = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 0.9 * scale, 8);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.15 * scale, 0.45 * scale, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);
        
        // 右腿
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.15 * scale, 0.45 * scale, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);
        
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.userData = { type: 'npc', entity: this };
        
        // 创建头顶称号标签
        this.createTitleTag();
        
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
     * 创建头顶称号标签
     */
    createTitleTag() {
        // 创建Canvas纹理显示称号
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // 绘制金色文字（带描边效果）
        context.font = 'bold 96px Microsoft YaHei, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制黑色描边
        context.strokeStyle = '#000000';
        context.lineWidth = 6;
        context.strokeText(this.title, 256, 128);
        
        // 绘制金色文字
        context.fillStyle = '#ffd700';
        context.fillText(this.title, 256, 128);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // 创建Sprite材质
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        // 创建Sprite
        this.titleTag = new THREE.Sprite(spriteMaterial);
        this.titleTag.scale.set(3.0, 1.5, 1);
        this.titleTag.position.y = 2.2 * this.size;
        
        this.mesh.add(this.titleTag);
    }

    /**
     * 更新（动画等）
     */
    update(deltaTime) {
        // 光环旋转动画
        if (this.glowMesh) {
            this.glowMesh.rotation.z += deltaTime * 0.5;
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
