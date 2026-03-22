/**
 * 寻道人 - 游戏主类
 * 整合所有模块的核心入口
 */

import Renderer from './core/Renderer.js';
import InputManager from './core/InputManager.js';
import Storage from './core/Storage.js';
import Player from './entities/Player.js';
import StarterVillage from './world/StarterVillage.js';
import CombatSystem from './systems/Combat.js';
import EffectsManager from './systems/EffectsManager.js';
import UIManager from './ui/UIManager.js';
import { getItem, useItem } from './data/items.js';

class Game {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        
        // 核心组件
        this.renderer = Renderer;
        this.input = InputManager;
        this.storage = Storage;
        
        // 游戏对象
        this.player = null;
        this.world = null;
        this.combat = null;
        this.effects = null;
        this.ui = null;
        
        // 当前存档
        this.currentSaveId = null;
        
        // 时间追踪
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // 设置
        this.settings = {
            quality: 'medium',
            showDamageNumbers: true
        };
        
        // 当前交互NPC
        this.currentNPC = null;
    }

    /**
     * 初始化游戏
     */
    async init() {
        console.log('寻道人 - 正在初始化...');
        
        try {
            // 初始化UI
            this.ui = new UIManager(this);
            this.ui.setLoadingProgress(10, '正在初始化存储...');
            
            // 初始化存储
            await this.storage.init();
            this.ui.setLoadingProgress(30, '正在加载设置...');
            
            // 加载设置
            this.settings = await this.storage.getSettings();
            this.ui.setLoadingProgress(50, '正在初始化渲染器...');
            
            // 初始化渲染器
            const canvas = document.getElementById('game-canvas');
            this.renderer.init(canvas, this.settings.quality);
            this.ui.setLoadingProgress(70, '正在初始化输入系统...');
            
            // 初始化输入
            this.input.init(canvas);
            this.input.setEnabled(false);
            this.ui.setLoadingProgress(90, '正在完成初始化...');
            
            // 绑定UI事件
            this.bindUIEvents();
            
            // 完成加载
            this.ui.setLoadingProgress(100, '加载完成！');
            
            setTimeout(() => {
                this.ui.showScreen('mainMenu');
            }, 500);
            
            console.log('寻道人 - 初始化完成');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.ui.showToast('游戏初始化失败', 'error');
        }
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        this.ui.bindMenuEvents({
            onContinue: () => this.showSaveList(),
            onCreateCharacter: (name) => this.createNewGame(name),
            onSaveSettings: (settings) => this.saveSettings(settings)
        });
        
        this.ui.bindGameUIEvents({
            onSkillUse: (skillId) => this.useSkill(skillId),
            onDialogOption: (option) => this.handleDialogOption(option),
            onPanelOpen: (panel) => this.handlePanelOpen(panel),
            onSave: () => this.manualSave(),
            onMenu: () => this.toggleGameMenu()
        });
        
        // [DEBUG] F8 快速生成81级测试存档
        window.addEventListener('keydown', async (e) => {
            if (e.key === 'F8') {
                console.log('正在生成测试存档...');
                this.ui.showToast('正在生成测试存档...', 'info');

                const playerData = {
                    name: "测试天尊",
                    level: 81,
                    exp: 0,
                    gold: 999999,
                    classId: "body",
                    specializationId: null,
                    baseHp: 16000,
                    baseMp: 4000,
                    baseAttack: 2000,
                    baseDefense: 1500,
                    baseSpeed: 10,
                    hp: 99999,
                    mp: 99999,
                    position: { x: 0, y: 0, z: 5 },
                    rotation: 0,
                    inventory: [
                        { itemId: "hpPotion", count: 99 },
                        { itemId: "mpPotion", count: 99 },
                        { itemId: "woodCore", count: 99 },
                        { itemId: "stoneChunk", count: 99 }
                    ],
                    equipment: {
                        weapon: null,
                        armor: null,
                        accessory: null
                    },
                    learnedSkills: ["punch", "breathe", "dodge", "charge", "ironFist", "vajraBody", "earthquake"],
                    skillCooldowns: {},
                    quests: [],
                    completedQuests: [],
                    tutorialComplete: true,
                    foundMysteriousElder: false
                };

                const saveData = {
                    name: "测试天尊",
                    player: playerData
                };

                await this.storage.saveGame(saveData);
                this.ui.showToast('测试存档已生成！请刷新页面读取', 'success');
                console.log('测试存档已生成');
            }
        });
    }

    /**
     * 创建新游戏
     */
    async createNewGame(playerName) {
        console.log('创建新游戏:', playerName);
        
        // 创建玩家
        this.player = new Player(playerName);
        
        // 创建世界
        this.world = new StarterVillage();
        this.world.create(this.renderer.scene);
        
        // 创建玩家模型
        const playerMesh = this.player.createMesh();
        this.renderer.add(playerMesh);
        
        // 添加头顶标识到场景
        if (this.player.indicator) {
            this.renderer.add(this.player.indicator);
        }
        
        // 初始化战斗系统
        this.combat = new CombatSystem(this);
        this.combat.init(this.player);
        
        // 初始化效果管理器
        this.effects = new EffectsManager(this.renderer.scene);
        this.combat.setEffectsManager(this.effects);
        
        // 保存初始存档
        const saveData = {
            name: playerName,
            player: this.player.toSaveData()
        };
        this.currentSaveId = await this.storage.saveGame(saveData);
        
        // 启动游戏
        this.startGame();
    }

    /**
     * 加载存档
     */
    async loadGame(saveId) {
        console.log('加载存档:', saveId);
        
        const saveData = await this.storage.getSave(saveId);
        if (!saveData) {
            this.ui.showToast('存档不存在', 'error');
            return;
        }
        
        // 创建玩家
        this.player = new Player();
        this.player.loadFromSaveData(saveData.player);
        
        // 创建世界
        this.world = new StarterVillage();
        this.world.create(this.renderer.scene);
        
        // 创建玩家模型
        const playerMesh = this.player.createMesh();
        this.renderer.add(playerMesh);
        
        // 添加头顶标识到场景
        if (this.player.indicator) {
            this.renderer.add(this.player.indicator);
        }
        
        // 初始化战斗系统
        this.combat = new CombatSystem(this);
        this.combat.init(this.player);
        
        // 初始化效果管理器
        this.effects = new EffectsManager(this.renderer.scene);
        this.combat.setEffectsManager(this.effects);
        
        this.currentSaveId = saveId;
        
        // 启动游戏
        this.startGame();
    }

    /**
     * 显示存档列表
     */
    async showSaveList() {
        const saves = await this.storage.getAllSaves();
        
        if (saves.length === 0) {
            this.ui.showToast('没有存档', 'info');
            return;
        }
        
        // 显示存档列表界面
        const container = document.querySelector('.saves-container');
        if (container) {
            container.innerHTML = '';
            
            saves.forEach(save => {
                const div = document.createElement('div');
                div.className = 'save-item';
                div.dataset.saveId = save.id;
                
                const player = save.player;
                const date = new Date(save.updateTime).toLocaleString();
                
                div.innerHTML = `
                    <div class="save-info">
                        <span class="save-name">${player.name}</span>
                        <span class="save-level">Lv.${player.level}</span>
                    </div>
                    <div class="save-date">${date}</div>
                    <button class="delete-save-btn" data-save-id="${save.id}">删除</button>
                `;
                
                div.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-save-btn')) {
                        this.loadGame(save.id);
                    }
                });
                
                container.appendChild(div);
            });
            
            // 删除按钮事件
            container.querySelectorAll('.delete-save-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const saveId = parseInt(btn.dataset.saveId);
                    await this.storage.deleteSave(saveId);
                    this.ui.showToast('存档已删除', 'info');
                    this.showSaveList();
                });
            });
        }
        
        this.ui.showScreen('saveList');
    }

    /**
     * 保存设置
     */
    async saveSettings(settings) {
        this.settings = settings;
        await this.storage.saveSettings(settings);
        this.renderer.setQuality(settings.quality);
        this.ui.showToast('设置已保存', 'success');
    }

    /**
     * 启动游戏循环
     */
    startGame() {
        this.isRunning = true;
        this.input.setEnabled(true);
        this.ui.showScreen('gameUI');
        
        // 初始化UI
        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        
        // 绑定输入事件
        this.bindInputEvents();
        
        // 开始游戏循环
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
        
        this.ui.showToast(`欢迎来到寻道世界，${this.player.name}！`, 'info');
    }

    /**
     * 绑定输入事件
     */
    bindInputEvents() {
        // 鼠标点击选中目标
        this.input.on('click', (mouse, event) => {
            if (this.ui.isDialogOpen) return;

            const intersects = this.renderer.raycast(
                { x: mouse.x, y: mouse.y },
                this.world.getSelectableObjects()
            );

            if (intersects.length > 0) {
                const hit = intersects[0].object;
                // 向上查找到包含 userData 的父对象
                let target = hit;
                while (target && !target.userData?.type && target.parent) {
                    target = target.parent;
                }
                const entity = target?.userData?.entity;

                if (entity) {
                    if (target.userData.type === 'monster' && !entity.isDead) {
                        this.combat.setTarget(entity);
                        this.ui.updateTargetFrame(entity);
                    } else if (target.userData.type === 'npc') {
                        this.interactWithNPC(entity);
                    }
                }
            } else {
                this.combat.clearTarget();
                this.ui.updateTargetFrame(null);
            }
        });

        // 右键丢弃目标
        this.input.on('rightclick', () => {
            this.combat.clearTarget();
            this.ui.updateTargetFrame(null);
        });

        // 鼠标悬停事件
        this.input.on('hover', (current, previous) => {
            this.handleHoverChange(current, previous);
        });
        
        // 技能快捷键
        this.input.on('keydown', (key) => {
            if (this.ui.isDialogOpen) return;
            
            // 数字键使用技能
            if (key >= '1' && key <= '7') {
                const skillSlots = document.querySelectorAll('.skill-slot');
                const slot = skillSlots[parseInt(key) - 1];
                if (slot && slot.dataset.skillId) {
                    this.useSkill(slot.dataset.skillId);
                }
            }
        });
    }

    /**
     * 游戏主循环
     */
    gameLoop(time) {
        if (!this.isRunning) return;
        
        // 计算deltaTime
        this.deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        // 限制deltaTime防止卡顿
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * 更新游戏状态
     */
    update(deltaTime) {
        // 获取移动输入
        const direction = this.input.getMovementDirection();
        
        // 保存移动前的位置
        const previousPosition = { ...this.player.position };
        
        // 计算下一步位置（用于预判碰撞）
        const moveSpeed = this.player.speed * deltaTime * 5;
        const nextPosition = {
            x: this.player.position.x + direction.x * moveSpeed,
            z: this.player.position.z + direction.z * moveSpeed
        };
        
        // 预判篱笆碰撞 - 在移动前检查下一步是否会撞到篱笆
        const fenceCollision = this.world.checkFenceCollision(nextPosition);
        let isFenceBlocked = false;
        if (fenceCollision) {
            isFenceBlocked = true;
            // 显示提示（限制频率，避免闪烁）
            if (!this.fenceCollisionTimer || Date.now() - this.fenceCollisionTimer > 2000) {
                const screenPos = this.renderer.worldToScreen(this.player.mesh.position);
                if (screenPos) {
                    this.ui.showPopupAtPosition(screenPos.x, screenPos.y - 80, '请从大门进出村庄', 'warning');
                }
                this.fenceCollisionTimer = Date.now();
            }
        }
        
        // 如果会被篱笆阻挡，则只更新朝向但不移动
        if (isFenceBlocked) {
            // 只更新朝向
            if (direction.x !== 0 || direction.z !== 0) {
                this.player.rotation = Math.atan2(direction.x, direction.z);
                this.player.isMoving = false;
            }
            // 更新3D对象（只更新旋转）
            if (this.player.mesh) {
                this.player.mesh.rotation.y = this.player.rotation;
            }
        } else {
            // 正常更新玩家位置
            this.player.update(deltaTime, direction);
        }
        
        // 边界限制
        this.player.clampPosition(
            this.world.bounds.minX + 1,
            this.world.bounds.maxX - 1,
            this.world.bounds.minZ + 1,
            this.world.bounds.maxZ - 1
        );
        
        // 建筑物碰撞检测
        const collision = this.world.checkBuildingCollision(this.player.position);
        if (collision) {
            // 将玩家推出建筑物
            const resolvedPosition = this.world.resolveBuildingCollision(this.player.position, collision);
            this.player.position.x = resolvedPosition.x;
            this.player.position.z = resolvedPosition.z;
            
            // 更新玩家模型位置
            if (this.player.mesh) {
                this.player.mesh.position.x = this.player.position.x;
                this.player.mesh.position.z = this.player.position.z;
            }
            
            // 显示碰撞提示（只在刚碰撞时显示，在人物附近弹出）
            if (!this.buildingCollisionTimer || Date.now() - this.buildingCollisionTimer > 2000) {
                const screenPos = this.renderer.worldToScreen(this.player.mesh.position);
                if (screenPos) {
                    this.ui.showPopupAtPosition(screenPos.x, screenPos.y - 80, `${collision.name}挡路了，请绕行`, 'warning');
                }
                this.buildingCollisionTimer = Date.now();
            }
        }
        
        // 更新相机
        this.renderer.updateCamera(this.player.mesh.position);
        
        // 更新世界和获取怪物攻击
        const monsterAttacks = this.world.update(deltaTime, this.player, this.renderer.camera);
        
        // 处理怪物攻击
        monsterAttacks.forEach(attack => {
            const result = this.combat.processMonsterAttack(attack);
            this.handleCombatResult(result);
        });
        
        // 更新战斗系统
        const combatResult = this.combat.update(deltaTime);
        if (combatResult) {
            this.handleCombatResult(combatResult);
        }
        
        // 更新视觉效果
        if (this.effects) {
            this.effects.update(deltaTime);
        }

        // 检测鼠标悬停
        this.checkHover();

        // 更新UI
        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        
        // 更新目标框
        if (this.combat.target) {
            this.ui.updateTargetFrame(this.combat.target);
        }
        
        // 自动保存（每60秒）
        this.autoSaveTimer = (this.autoSaveTimer || 0) + deltaTime;
        if (this.autoSaveTimer >= 60) {
            this.autoSaveTimer = 0;
            this.autoSave();
        }
        
        // 检查玩家死亡
        if (this.player.hp <= 0) {
            this.handlePlayerDeath();
        }
    }

    /**
     * 渲染
     */
    render() {
        this.renderer.render();
    }

    /**
     * 检测鼠标悬停
     */
    checkHover() {
        const mouse = this.input.mouse;

        // 获取所有可交互对象（包括装饰物）
        const objects = this.world.getAllInteractableObjects();

        const intersects = this.renderer.raycast(
            { x: mouse.x, y: mouse.y },
            objects
        );

        let hoveredObject = null;
        if (intersects.length > 0) {
            const hit = intersects[0].object;
            // 向上查找到包含 userData 的父对象
            let target = hit;
            while (target && !target.userData?.type && target.parent) {
                target = target.parent;
            }
            if (target?.userData?.type) {
                hoveredObject = target;
            }
        }

        this.input.handleHover(hoveredObject);
    }

    /**
     * 处理悬停变化
     */
    handleHoverChange(current, previous) {
        const tooltip = document.getElementById('tooltip');
        const tooltipName = document.getElementById('tooltip-name');
        const tooltipDesc = document.getElementById('tooltip-desc');

        if (!current) {
            tooltip.classList.add('hidden');
            return;
        }

        const type = current.userData.type;
        const entity = current.userData.entity;

        let name = '';
        let desc = '';

        switch (type) {
            case 'npc':
                name = entity.name;
                desc = entity.title || 'NPC';
                break;
            case 'monster':
                name = `${entity.name} (Lv.${entity.level})`;
                desc = entity.isDead ? '已死亡' : '点击进行攻击';
                break;
            case 'building':
                name = entity.name;
                desc = '建筑物';
                break;
            case 'tree':
                name = '灵树';
                desc = '散发着淡淡灵气的树木';
                break;
            case 'rock':
                name = '岩石';
                desc = '普通的岩石';
                break;
            default:
                return;
        }

        tooltipName.textContent = name;
        tooltipDesc.textContent = desc;
        tooltip.classList.remove('hidden');

        // 更新提示框位置
        this.updateTooltipPosition();
    }

    /**
     * 更新提示框位置
     */
    updateTooltipPosition() {
        const tooltip = document.getElementById('tooltip');
        const mouse = this.input.mouse;

        // 将归一化坐标转换为屏幕坐标
        const x = (mouse.x + 1) * window.innerWidth / 2;
        const y = (-mouse.y + 1) * window.innerHeight / 2;

        // 偏移一点避免遮挡鼠标
        tooltip.style.left = `${x + 15}px`;
        tooltip.style.top = `${y + 15}px`;
    }

    /**
     * 使用技能
     */
    useSkill(skillId) {
        const result = this.combat.useSkill(skillId);

        if (result.success) {
            this.handleCombatResult(result);
        } else {
            const screenPos = this.renderer.worldToScreen(this.player.mesh.position);
            if (screenPos) {
                // 如果没有目标，在角色附近显示提示
                if (result.message === '没有目标') {
                    this.ui.showPopupAtPosition(screenPos.x, screenPos.y - 80, '请选择攻击目标', 'warning');
                } else if (result.message === '目标距离过远') {
                    this.ui.showPopupAtPosition(screenPos.x, screenPos.y - 80, '目标距离过远', 'warning');
                } else {
                    this.ui.showToast(result.message, 'warning');
                }
            } else {
                this.ui.showToast(result.message, 'warning');
            }
        }
    }

    /**
     * 处理战斗结果
     */
    handleCombatResult(result) {
        if (!result) return;
        
        // 显示伤害数字
        if (result.type === 'damage' && this.settings.showDamageNumbers) {
            let screenPos;
            
            if (result.source === 'player' && result.target) {
                screenPos = this.renderer.worldToScreen(result.target.mesh.position);
            } else if (result.source === 'monster') {
                screenPos = this.renderer.worldToScreen(this.player.mesh.position);
            }
            
            if (screenPos) {
                this.ui.showDamageNumber(screenPos.x, screenPos.y, result.damage, result.source === 'monster');
            }
        }
        
        // 击杀奖励
        if (result.killed) {
            // 获取怪物死亡位置（用于显示奖励）
            let rewardScreenPos = null;
            if (result.target && result.target.mesh) {
                rewardScreenPos = this.renderer.worldToScreen(result.target.mesh.position);
            }
            
            // 经验
            if (result.exp) {
                const expResults = this.player.gainExp(result.exp);
                
                // 在怪物头顶显示经验奖励
                if (rewardScreenPos) {
                    this.ui.showRewardAtPosition(rewardScreenPos.x, rewardScreenPos.y - 30, `+${result.exp} 经验`, 'exp');
                } else {
                    this.ui.showExpGain(result.exp);
                }
                
                expResults.forEach(r => {
                    if (r.type === 'levelUp') {
                        this.ui.showLevelUp(r.level);
                    } else if (r.type === 'realmUp') {
                        this.ui.showRealmUp(r.realm);
                    }
                });
            }
            
            // 金币
            if (result.gold) {
                this.player.gainGold(result.gold);
                
                // 在怪物头顶显示金币奖励（在经验下方）
                if (rewardScreenPos) {
                    this.ui.showRewardAtPosition(rewardScreenPos.x, rewardScreenPos.y, `+${result.gold} 金币`, 'gold');
                } else {
                    this.ui.showGoldGain(result.gold);
                }
            }
            
            // 掉落物品
            if (result.drops) {
                result.drops.forEach(drop => {
                    const item = getItem(drop.itemId);
                    if (item && this.player.addItem(item, drop.count)) {
                        this.ui.showToast(`获得 ${item.name} x${drop.count}`, 'success');
                    }
                });
            }
            
            // 清除目标
            this.combat.clearTarget();
            this.ui.updateTargetFrame(null);
        }
    }

    /**
     * 与NPC交互
     */
    interactWithNPC(npc) {
        if (!npc.canInteract(this.player.position)) {
            // 在NPC头顶显示距离提示，而不是右侧Toast
            this.ui.showQuestPopup(
                { x: npc.position.x, y: npc.position.y + 2, z: npc.position.z },
                '距离太远了，靠近一些',
                'warning',
                (pos) => this.renderer.worldToScreen(pos)
            );
            return;
        }

        this.currentNPC = npc;
        npc.lookAtPlayer(this.player.position);

        const dialog = npc.getDialog(null, this.player);
        this.ui.showDialog(npc, dialog);
    }

    /**
     * 在NPC头顶显示任务提示
     * @param {string} npcId - NPC的ID
     * @param {string} message - 提示消息
     * @param {string} type - 提示类型
     */
    showQuestNotification(npcId, message, type = 'quest') {
        const npc = this.world.getNPC(npcId);
        if (npc) {
            this.ui.showQuestPopup(
                { x: npc.position.x, y: npc.position.y + 2, z: npc.position.z },
                message,
                type,
                (pos) => this.renderer.worldToScreen(pos)
            );
        }
    }

    /**
     * 处理对话选项
     */
    handleDialogOption(option) {
        const { action, next } = option;
        
        if (next) {
            // 跳转到下一段对话
            const dialog = this.currentNPC.getDialog(next, this.player);
            this.ui.showDialog(this.currentNPC, dialog);
            return;
        }
        
        switch (action) {
            case 'close':
                this.ui.hideDialog();
                this.currentNPC = null;
                break;
                
            case 'showClass':
                this.ui.hideDialog();
                this.ui.showClassSelection((classId) => {
                    this.selectClass(classId);
                });
                break;
                
            case 'openShop':
                this.ui.hideDialog();
                if (this.currentNPC && this.currentNPC.shopItems) {
                    this.openShop(this.currentNPC.shopItems);
                }
                break;
                
            case 'openSkills':
                this.ui.hideDialog();
                this.ui.togglePanel('skillsPanel');
                break;
                
            case 'startTutorial':
                this.ui.hideDialog();
                this.ui.showToast('战斗教程：用1-4键释放技能，点击怪物攻击', 'info');
                this.player.tutorialComplete = true;
                break;

            case 'learnDragonGrip':
                if (this.player.learnedSkills.includes('dragonGrip')) {
                    this.ui.showToast('你已经学会擒龙功了', 'warning');
                } else {
                    this.player.learnedSkills.push('dragonGrip');
                    this.player.baseHp += 50;
                    this.player.hp = this.player.maxHp;
                    this.ui.updatePlayerHUD(this.player);
                    this.ui.showToast('学会了擒龙功！基础生命值+50', 'success');
                }
                this.ui.hideDialog();
                break;

            case 'giveGift':
                this.player.gainGold(100);
                this.player.foundMysteriousElder = true;
                this.ui.showToast('神秘老者赠予你100金币！', 'success');
                this.currentNPC.setDialog('afterGift');
                const dialog = this.currentNPC.getDialog('afterGift', this.player);
                this.ui.showDialog(this.currentNPC, dialog);
                break;
                
            default:
                this.ui.hideDialog();
        }
    }

    /**
     * 选择/重新选择职业
     */
    selectClass(classId) {
        const hadClass = !!this.player.classId;
        if (hadClass) {
            // 移除旧职业技能
            const oldSkills = this.getClassSkillIds(this.player.classId);
            this.player.learnedSkills = this.player.learnedSkills.filter(id => !oldSkills.includes(id));
            this.player.classId = null;
            this.player.specializationId = null;
        }

        this.player.classId = classId;

        // 学习新职业技能
        const newSkills = this.getClassSkillIds(classId);
        newSkills.forEach(id => {
            if (!this.player.learnedSkills.includes(id)) {
                this.player.learnedSkills.push(id);
            }
        });

        // 更新属性
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;

        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        this.ui.showToast(hadClass ? '重新转职成功！' : '转职成功！', 'success');
    }

    /**
     * 打开商店
     * @param {Array} shopItems - 商店物品ID列表
     */
    openShop(shopItems) {
        this.ui.showShop(shopItems, this.player.gold, (item) => {
            // 检查金币是否足够
            if (this.player.gold < item.price) {
                return { success: false, message: '金币不足' };
            }

            // 检查背包是否有空间
            // 1. 先检查是否可以堆叠到已有物品
            const canStack = item.stackable && this.player.inventory.some(slot =>
                slot && slot.itemId === item.id && slot.count < item.maxStack
            );
            // 2. 再检查是否有空格子
            const hasEmptySlot = this.player.inventory.some(slot => slot === null);

            console.log('购买检查:', { itemId: item.id, stackable: item.stackable, canStack, hasEmptySlot, inventory: this.player.inventory });

            if (!canStack && !hasEmptySlot) {
                return { success: false, message: '背包已满' };
            }

            // 扣除金币
            this.player.gold -= item.price;

            // 添加物品到背包
            const addResult = this.player.addItem(item, 1);
            console.log('添加物品结果:', addResult);

            // 更新UI
            this.ui.updatePlayerHUD(this.player);
            this.ui.updateInventoryPanel(this.player);

            return { success: true, newGold: this.player.gold };
        });
    }

    /**
     * 获取职业技能ID列表
     */
    getClassSkillIds(classId) {
        // 硬编码映射，避免异步问题
        const map = {
            body: ['ironFist', 'vajraBody', 'earthquake'],
            qi: ['qiBlast', 'thunderStrike', 'spiritShield'],
            spirit: ['paralyze', 'rejuvenate', 'soulFear']
        };
        return map[classId] || [];
    }

    /**
     * 面板打开回调
     */
    handlePanelOpen(panel) {
        if (panel === 'character') {
            this.ui.updateCharacterPanel(this.player);
        } else if (panel === 'inventory') {
            this.ui.updateInventoryPanel(this.player);
        } else if (panel === 'skills') {
            this.ui.updateSkillsPanel(this.player);
        } else if (panel === 'quest') {
            this.ui.updateQuestLog(this.player);
        }
    }

    /**
     * 处理物品点击
     */
    handleItemClick(item, index) {
        if (!item) return;

        // 使用物品逻辑
        if (item.type === 'consumable') {
             const result = useItem(item, this.player);
             if (result.success) {
                 this.ui.showToast(result.message, 'success');
                 // 减少数量或移除
                 if (item.stackable && item.count > 1) {
                     item.count--;
                 } else {
                     this.player.inventory[index] = null;
                 }
                 this.ui.updateInventoryPanel(this.player);
                 this.ui.updatePlayerHUD(this.player);
             } else {
                 this.ui.showToast(result.message, 'warning'); // 例如满血时
             }
        } else {
            // 其他物品显示描述
            this.ui.showToast(item.description, 'info');
        }
    }

    /**
     * 处理玩家死亡
     */
    handlePlayerDeath() {
        this.ui.showToast('你被击败了！将在原地复活...', 'error');
        
        // 复活
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        this.player.position = { x: 0, y: 0, z: 5 };
        
        if (this.player.mesh) {
            this.player.mesh.position.set(0, 0.9, 5);
        }
        
        this.combat.clearTarget();
        this.ui.updateTargetFrame(null);
    }

    /**
     * 自动保存
     */
    async autoSave() {
        if (!this.currentSaveId) return;
        
        try {
            await this.storage.saveGame({
                id: this.currentSaveId,
                name: this.player.name,
                player: this.player.toSaveData()
            });
            console.log('自动保存完成');
        } catch (error) {
            console.error('自动保存失败:', error);
        }
    }

    /**
     * 手动保存
     */
    async manualSave() {
        await this.autoSave();
        this.ui.showToast('游戏已保存', 'success');
    }

    /**
     * 切换游戏菜单
     */
    toggleGameMenu() {
        const gameMenu = document.getElementById('game-menu');
        if (gameMenu) {
            const isHidden = gameMenu.classList.contains('hidden');
            gameMenu.classList.toggle('hidden');
            this.isPaused = isHidden;
        }
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
    
    // 暴露到全局以便调试
    window.game = game;
});

export default Game;
