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
        this.mesh = new THREE.Group();
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.userData = { type: 'npc', entity: this };
        
        const s = this.size;
        const bodyColor = this.color;
        const limbColor = new THREE.Color(this.color).multiplyScalar(0.8);
        const headColor = 0xffccaa;
        
        // 身体
        const bodyGeometry = new THREE.BoxGeometry(0.6 * s, 0.8 * s, 0.4 * s);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: bodyColor,
            emissive: new THREE.Color(this.color).multiplyScalar(0.2)
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 1.0 * s, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        
        // 头部
        const headGeometry = new THREE.SphereGeometry(0.3 * s, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: headColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1.75 * s, 0);
        head.castShadow = true;
        head.receiveShadow = true;
        this.mesh.add(head);
        
        // 左臂
        const leftArmGeometry = new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.6 * s, 8);
        const leftArmMaterial = new THREE.MeshLambertMaterial({ color: limbColor });
        const leftArm = new THREE.Mesh(leftArmGeometry, leftArmMaterial);
        leftArm.position.set(-0.4 * s, 0.7 * s, 0);
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        this.mesh.add(leftArm);
        
        // 右臂
        const rightArmGeometry = new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.6 * s, 8);
        const rightArmMaterial = new THREE.MeshLambertMaterial({ color: limbColor });
        const rightArm = new THREE.Mesh(rightArmGeometry, rightArmMaterial);
        rightArm.position.set(0.4 * s, 0.7 * s, 0);
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;
        this.mesh.add(rightArm);
        
        // 左腿
        const leftLegGeometry = new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.7 * s, 8);
        const leftLegMaterial = new THREE.MeshLambertMaterial({ color: limbColor });
        const leftLeg = new THREE.Mesh(leftLegGeometry, leftLegMaterial);
        leftLeg.position.set(-0.2 * s, 0.35 * s, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.mesh.add(leftLeg);
        
        // 右腿
        const rightLegGeometry = new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.7 * s, 8);
        const rightLegMaterial = new THREE.MeshLambertMaterial({ color: limbColor });
        const rightLeg = new THREE.Mesh(rightLegGeometry, rightLegMaterial);
        rightLeg.position.set(0.2 * s, 0.35 * s, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.mesh.add(rightLeg);
        
        // 创建名称标签
        this.createNameTag();
        
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
     * 创建头顶名称标签
     */
    createNameTag() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.font = 'Bold 40px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        context.fillStyle = 'gold';
        const displayName = this.name.includes('·') ? this.name.split('·')[0] : this.name;
        context.fillText(displayName, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });
        
        this.nameTag = new THREE.Sprite(material);
        this.nameTag.scale.set(3, 0.75, 1);
        this.nameTag.position.set(0, 2.2 * this.size, 0);
        this.mesh.add(this.nameTag);
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
