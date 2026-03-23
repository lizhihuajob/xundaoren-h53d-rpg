/**
 * 寻道人 - 玩家实体类
 * 圆柱体作为角色模型
 */

import { getRealmByLevel, getExpRequired, getRealmBonus } from '../data/realms.js';
import { getClass, getSpecialization } from '../data/classes.js';
import { getBaseSkills, getClassSkills } from '../data/skills.js';

export default class Player {
    constructor(name = '玩家') {
        // 基础信息
        this.name = name;
        this.level = 0;
        this.exp = 0;
        this.gold = 100;
        
        // 职业信息
        this.classId = null;
        this.specializationId = null;
        
        // 基础属性
        this.baseHp = 100;
        this.baseMp = 50;
        this.baseAttack = 10;
        this.baseDefense = 5;
        this.baseSpeed = 5;
        
        // 装备（需要在hp/mp计算前初始化）
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        // 增益效果
        this.buffs = [];
        
        // 当前属性
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        // 位置和移动
        this.position = { x: 0, y: 0, z: 5 };
        this.rotation = 0;
        this.isMoving = false;
        this.velocity = { x: 0, z: 0 };
        
        // 战斗状态
        this.target = null;
        this.inCombat = false;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 普攻冷却1秒
        
        // 技能冷却
        this.skillCooldowns = {};
        
        // 背包（初始化为null数组，表示空槽位）
        this.inventory = new Array(24).fill(null);
        this.maxInventory = 24;
        
        // 已学技能
        this.learnedSkills = ['punch', 'breathe', 'dodge', 'charge'];
        
        // 任务进度
        this.quests = [];
        this.completedQuests = [];
        
        // 3D对象
        this.mesh = null;
        this.nameTag = null;
        this.indicator = null; // 头顶倒三角标识
        
        // 标记
        this.tutorialComplete = false;
        this.foundMysteriousElder = false;
    }

    /**
     * 计算当前境界
     */
    get realm() {
        return getRealmByLevel(this.level);
    }

    /**
     * 计算最大生命值
     */
    get maxHp() {
        let base = this.baseHp;
        
        // 职业加成
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.hp;
        }
        
        // 专精加成
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.hp) {
                base *= spec.bonusStats.hp;
            }
        }
        
        // 境界加成
        base *= getRealmBonus(this.level);
        
        // 装备加成
        if (this.equipment.armor && this.equipment.armor.stats.hp) {
            base += this.equipment.armor.stats.hp;
        }
        
        return Math.floor(base);
    }

    /**
     * 计算最大法力值
     */
    get maxMp() {
        let base = this.baseMp;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.mp;
        }
        
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.mp) {
                base *= spec.bonusStats.mp;
            }
        }
        
        base *= getRealmBonus(this.level);
        
        return Math.floor(base);
    }

    /**
     * 计算攻击力
     */
    get attack() {
        let base = this.baseAttack;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.attack;
        }
        
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.attack) {
                base *= spec.bonusStats.attack;
            }
        }
        
        base *= getRealmBonus(this.level);
        
        if (this.equipment.weapon && this.equipment.weapon.stats.attack) {
            base += this.equipment.weapon.stats.attack;
        }
        
        // 蓄力buff
        const chargeBuff = this.buffs.find(b => b.id === 'charge');
        if (chargeBuff) {
            base *= (1 + chargeBuff.damageBonus);
        }
        
        return Math.floor(base);
    }

    /**
     * 计算防御力
     */
    get defense() {
        let base = this.baseDefense;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.defense;
        }
        
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.defense) {
                base *= spec.bonusStats.defense;
            }
        }
        
        base *= getRealmBonus(this.level);
        
        if (this.equipment.armor && this.equipment.armor.stats.defense) {
            base += this.equipment.armor.stats.defense;
        }
        
        return Math.floor(base);
    }

    /**
     * 计算移动速度
     */
    get speed() {
        let base = this.baseSpeed;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.speed;
        }
        
        return base;
    }

    /**
     * 获取职业名称
     */
    get className() {
        if (!this.classId) return null;
        const cls = getClass(this.classId);
        return cls ? cls.name : null;
    }

    /**
     * 获取专精名称
     */
    get specializationName() {
        if (!this.classId || !this.specializationId) return null;
        const spec = getSpecialization(this.classId, this.specializationId);
        return spec ? spec.name : null;
    }

    /**
     * 创建3D模型
     */
    createMesh() {
        // 创建角色组
        this.mesh = new THREE.Group();
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.userData = { type: 'player', entity: this };

        // 身体材质
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00aaff,
            emissive: 0x002244
        });
        const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xffccaa });
        const darkMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        // 1. 躯干
        const torsoGeometry = new THREE.BoxGeometry(0.5, 0.7, 0.3);
        const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
        torso.position.set(0, 1.1, 0);
        torso.castShadow = true;
        this.mesh.add(torso);

        // 2. 头部
        const headGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.set(0, 1.7, 0);
        head.castShadow = true;
        this.mesh.add(head);

        // 3. 左臂
        const armGeometry = new THREE.BoxGeometry(0.12, 0.6, 0.12);
        const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        leftArm.position.set(-0.35, 1.1, 0);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);

        // 4. 右臂
        const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
        rightArm.position.set(0.35, 1.1, 0);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);

        // 5. 左腿
        const legGeometry = new THREE.BoxGeometry(0.15, 0.7, 0.15);
        const leftLeg = new THREE.Mesh(legGeometry, darkMaterial);
        leftLeg.position.set(-0.15, 0.35, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);

        // 6. 右腿
        const rightLeg = new THREE.Mesh(legGeometry, darkMaterial);
        rightLeg.position.set(0.15, 0.35, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);
        
        // 创建头顶倒三角标识
        this.createIndicator();
        
        return this.mesh;
    }

    /**
     * 创建头顶倒三角标识
     */
    createIndicator() {
        // 创建倒三角几何体（圆锥体倒置）
        const indicatorGeometry = new THREE.ConeGeometry(0.3, 0.5, 3);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9
        });
        
        this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        // 倒置圆锥体形成倒三角
        this.indicator.rotation.x = Math.PI;
        // 位置在玩家头顶上方
        this.indicator.position.set(this.position.x, this.position.y + 2.5, this.position.z);
        
        // 添加发光效果（内层小一点的倒三角）
        const glowGeometry = new THREE.ConeGeometry(0.2, 0.35, 3);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x88ff88,
            transparent: true,
            opacity: 0.6
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.rotation.x = Math.PI;
        glowMesh.position.z = 0.05;
        this.indicator.add(glowMesh);
    }

    /**
     * 更新位置
     */
    update(deltaTime, direction) {
        // 移动处理
        if (direction.x !== 0 || direction.z !== 0) {
            const moveSpeed = this.speed * deltaTime * 5;
            
            this.position.x += direction.x * moveSpeed;
            this.position.z += direction.z * moveSpeed;
            
            // 旋转朝向移动方向
            this.rotation = Math.atan2(direction.x, direction.z);
            
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
        
        // 更新3D对象
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
            this.mesh.rotation.y = this.rotation;
        }
        
        // 更新头顶标识位置
        if (this.indicator) {
            this.indicator.position.x = this.position.x;
            this.indicator.position.z = this.position.z;
            // 添加轻微的上下浮动动画效果
            const time = Date.now() * 0.003;
            this.indicator.position.y = this.position.y + 2.5 + Math.sin(time) * 0.1;
        }
        
        // 更新buff持续时间
        this.updateBuffs(deltaTime);
        
        // 更新技能冷却
        this.updateCooldowns(deltaTime);
        
        // 生命/法力回复（脱战时）
        if (!this.inCombat) {
            this.regenTick(deltaTime);
        }
    }

    /**
     * 更新buff
     */
    updateBuffs(deltaTime) {
        this.buffs = this.buffs.filter(buff => {
            buff.remaining -= deltaTime * 1000;
            return buff.remaining > 0;
        });
    }

    /**
     * 更新冷却
     */
    updateCooldowns(deltaTime) {
        for (const skillId in this.skillCooldowns) {
            this.skillCooldowns[skillId] -= deltaTime * 1000;
            if (this.skillCooldowns[skillId] <= 0) {
                delete this.skillCooldowns[skillId];
            }
        }
    }

    /**
     * 脱战回复
     */
    regenTick(deltaTime) {
        // 每秒回复1%
        const regenRate = 0.01 * deltaTime;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * regenRate);
        this.mp = Math.min(this.maxMp, this.mp + this.maxMp * regenRate);
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        // 检查金刚不坏buff
        const vajraBuff = this.buffs.find(b => b.id === 'vajraBody');
        if (vajraBuff) {
            amount *= (1 - vajraBuff.damageReduction);
        }
        
        // 检查灵盾buff
        const shieldBuff = this.buffs.find(b => b.id === 'spiritShield');
        if (shieldBuff) {
            this.buffs = this.buffs.filter(b => b.id !== 'spiritShield');
            return 0; // 完全吸收
        }
        
        const finalDamage = Math.max(1, Math.floor(amount - this.defense * 0.5));
        this.hp = Math.max(0, this.hp - finalDamage);
        this.inCombat = true;
        
        return finalDamage;
    }

    /**
     * 治疗
     */
    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHp - this.hp);
        this.hp += actualHeal;
        return actualHeal;
    }

    /**
     * 消耗法力
     */
    useMp(amount) {
        if (this.mp < amount) return false;
        this.mp -= amount;
        return true;
    }

    /**
     * 获得经验
     */
    gainExp(amount) {
        // 设置蓄力buff使用后清除
        const chargeBuff = this.buffs.find(b => b.id === 'charge' && b.consumed);
        if (chargeBuff) {
            this.buffs = this.buffs.filter(b => b !== chargeBuff);
        }
        
        this.exp += amount;
        
        const results = [];
        
        // 检查升级
        while (this.level < 81) {
            const required = getExpRequired(this.level);
            if (this.exp >= required) {
                this.exp -= required;
                this.level++;
                results.push({ type: 'levelUp', level: this.level });
                
                // 升级回满血蓝
                this.hp = this.maxHp;
                this.mp = this.maxMp;
                
                // 检查境界突破
                const newRealm = getRealmByLevel(this.level);
                const oldRealm = getRealmByLevel(this.level - 1);
                if (newRealm.name !== oldRealm.name) {
                    results.push({ type: 'realmUp', realm: newRealm.name });
                }
            } else {
                break;
            }
        }
        
        return results;
    }

    /**
     * 获得金币
     */
    gainGold(amount) {
        this.gold += amount;
    }

    /**
     * 选择职业
     */
    selectClass(classId) {
        if (this.level < 10) return false;
        if (this.classId) return false;
        
        this.classId = classId;
        
        // 学习职业技能
        const classSkills = getClassSkills(classId);
        classSkills.forEach(skill => {
            if (!this.learnedSkills.includes(skill.id)) {
                this.learnedSkills.push(skill.id);
            }
        });
        
        // 更新属性
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        return true;
    }

    /**
     * 选择专精
     */
    selectSpecialization(specId) {
        if (this.level < 30) return false;
        if (!this.classId) return false;
        if (this.specializationId) return false;
        
        const spec = getSpecialization(this.classId, specId);
        if (!spec) return false;
        
        this.specializationId = specId;
        
        // 更新属性
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        return true;
    }

    /**
     * 添加物品到背包
     */
    addItem(item, count = 1) {
        // 检查是否可堆叠
        if (item.stackable) {
            const existingIndex = this.inventory.findIndex(inv => inv && inv.itemId === item.id && inv.count < item.maxStack);
            if (existingIndex !== -1) {
                const existing = this.inventory[existingIndex];
                const newCount = Math.min(item.maxStack, existing.count + count);
                const added = newCount - existing.count;
                existing.count = newCount;
                return added > 0;
            }
        }

        // 查找空槽位
        const emptySlot = this.inventory.findIndex(slot => slot === null);
        if (emptySlot === -1) {
            return false;
        }

        this.inventory[emptySlot] = { itemId: item.id, count };
        return true;
    }

    /**
     * 移除物品
     */
    removeItem(itemId, count = 1) {
        const index = this.inventory.findIndex(inv => inv && inv.itemId === itemId);
        if (index === -1) return false;

        this.inventory[index].count -= count;
        if (this.inventory[index].count <= 0) {
            this.inventory[index] = null;
        }

        return true;
    }

    /**
     * 检查是否有物品
     */
    hasItem(itemId, count = 1) {
        const item = this.inventory.find(inv => inv && inv.itemId === itemId);
        return item && item.count >= count;
    }

    /**
     * 边界检查
     */
    clampPosition(minX, maxX, minZ, maxZ) {
        this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
        this.position.z = Math.max(minZ, Math.min(maxZ, this.position.z));
        
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
        }
    }

    /**
     * 转换为存档数据
     */
    toSaveData() {
        return {
            name: this.name,
            level: this.level,
            exp: this.exp,
            gold: this.gold,
            classId: this.classId,
            specializationId: this.specializationId,
            hp: this.hp,
            mp: this.mp,
            position: { ...this.position },
            inventory: [...this.inventory],
            equipment: { ...this.equipment },
            learnedSkills: [...this.learnedSkills],
            quests: [...this.quests],
            completedQuests: [...this.completedQuests],
            tutorialComplete: this.tutorialComplete,
            foundMysteriousElder: this.foundMysteriousElder
        };
    }

    /**
     * 从存档数据恢复
     */
    loadFromSaveData(data) {
        Object.assign(this, data);
        this.hp = Math.min(this.hp, this.maxHp);
        this.mp = Math.min(this.mp, this.maxMp);
    }
}
