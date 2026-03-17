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
        // 创建NPC组
        this.mesh = new THREE.Group();
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.userData = { type: 'npc', entity: this };

        // 材质
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: this.color,
            emissive: new THREE.Color(this.color).multiplyScalar(0.3)
        });
        const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xffccaa });
        const darkMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        const s = this.size;

        // 1. 躯干
        const torsoGeometry = new THREE.BoxGeometry(0.4 * s, 0.6 * s, 0.25 * s);
        const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
        torso.position.set(0, 1.0 * s, 0);
        torso.castShadow = true;
        this.mesh.add(torso);

        // 2. 头部
        const headGeometry = new THREE.BoxGeometry(0.3 * s, 0.3 * s, 0.3 * s);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.set(0, 1.5 * s, 0);
        head.castShadow = true;
        this.mesh.add(head);

        // 3. 左臂
        const armGeometry = new THREE.BoxGeometry(0.1 * s, 0.5 * s, 0.1 * s);
        const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        leftArm.position.set(-0.28 * s, 1.0 * s, 0);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);

        // 4. 右臂
        const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
        rightArm.position.set(0.28 * s, 1.0 * s, 0);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);

        // 5. 左腿
        const legGeometry = new THREE.BoxGeometry(0.12 * s, 0.6 * s, 0.12 * s);
        const leftLeg = new THREE.Mesh(legGeometry, darkMaterial);
        leftLeg.position.set(-0.12 * s, 0.3 * s, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);

        // 6. 右腿
        const rightLeg = new THREE.Mesh(legGeometry, darkMaterial);
        rightLeg.position.set(0.12 * s, 0.3 * s, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);
        
        // 创建光环效果（如果需要）
        if (this.glow) {
            const glowGeometry = new THREE.RingGeometry(0.6 * s, 0.8 * s, 32);
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
        
        // 创建头顶名称标签
        this.createNameTag();
        
        return this.mesh;
    }

    /**
     * 创建头顶名称标签
     */
    createNameTag() {
        // 创建画布 - 增大尺寸
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // 绘制背景（半透明黑色）
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.roundRect(0, 0, canvas.width, canvas.height, 16);
        context.fill();
        
        // 绘制边框
        context.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        context.lineWidth = 4;
        context.roundRect(0, 0, canvas.width, canvas.height, 16);
        context.stroke();
        
        // 只绘制职业（title），增大字体
        context.font = 'bold 48px Arial, sans-serif';
        context.fillStyle = '#ffd700';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.title, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        
        // 创建精灵材质
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        // 创建精灵 - 增大尺寸
        this.nameTag = new THREE.Sprite(spriteMaterial);
        this.nameTag.scale.set(5, 1.25, 1);
        this.nameTag.position.set(0, 2.2 * this.size, 0);
        
        // 添加到mesh
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
            // mesh现在是Group，直接旋转整个组
            this.mesh.rotation.y = angle;
        }
    }
}
