/**
 * 寻道人 - 新手村场景
 * 包含地形、建筑、NPC和怪物
 */

import NPC from '../entities/NPC.js';
import Monster from '../entities/Monster.js';
import { getAllNPCs, getVisibleNPCs } from '../data/npcs.js';

export default class StarterVillage {
    constructor() {
        // 地图尺寸
        this.width = 50;
        this.height = 50;
        this.bounds = {
            minX: -this.width / 2,
            maxX: this.width / 2,
            minZ: -this.height / 2,
            maxZ: this.height / 2
        };
        
        // 场景对象
        this.ground = null;
        this.walls = [];
        this.buildings = [];
        this.npcs = [];
        this.monsters = [];
        this.decorations = []; // 装饰物（树、岩石等）
        
        // 怪物生成点
        this.monsterSpawns = [
            { monsterId: 'rabbitDemon', positions: [
                { x: -20, y: 0, z: -15 },
                { x: -22, y: 0, z: -18 },
                { x: -18, y: 0, z: -20 }
            ]},
            { monsterId: 'woodSpirit', positions: [
                { x: 20, y: 0, z: -20 },
                { x: 22, y: 0, z: -18 }
            ]},
            { monsterId: 'stoneGolem', positions: [
                { x: 0, y: 0, z: -22 }
            ]}
        ];
    }

    /**
     * 创建场景
     */
    create(scene) {
        this.scene = scene;
        
        this.createGround();
        this.createWalls();
        this.createBuildings();
        this.createNPCs();
        this.createMonsters();
        
        console.log('新手村场景创建完成');
    }

    /**
     * 创建地面
     */
    createGround() {
        // 主地面
        const groundGeometry = new THREE.PlaneGeometry(this.width, this.height);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3d5c3d,
            side: THREE.DoubleSide
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // 中央广场（浅色石板）- 在新村子中央
        const plazaGeometry = new THREE.CircleGeometry(6, 32);
        const plazaMaterial = new THREE.MeshLambertMaterial({
            color: 0x808080
        });
        const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
        plaza.rotation.x = -Math.PI / 2;
        plaza.position.set(-12, 0.01, -4);
        plaza.receiveShadow = true;
        this.scene.add(plaza);

        // 广场纹路 - 同心圆装饰
        for (let i = 1; i <= 3; i++) {
            const ringGeometry = new THREE.RingGeometry(6 - i * 1.5, 6 - i * 1.5 + 0.25, 32);
            const ringMaterial = new THREE.MeshLambertMaterial({
                color: 0x696969,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(-12, 0.02, -4);
            ring.receiveShadow = true;
            this.scene.add(ring);
        }

        // 广场纹路 - 十字线
        const crossLine1Geometry = new THREE.PlaneGeometry(0.25, 12);
        const crossLineMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const crossLine1 = new THREE.Mesh(crossLine1Geometry, crossLineMaterial);
        crossLine1.rotation.x = -Math.PI / 2;
        crossLine1.position.set(-12, 0.02, -4);
        crossLine1.receiveShadow = true;
        this.scene.add(crossLine1);

        const crossLine2Geometry = new THREE.PlaneGeometry(12, 0.25);
        const crossLine2 = new THREE.Mesh(crossLine2Geometry, crossLineMaterial);
        crossLine2.rotation.x = -Math.PI / 2;
        crossLine2.position.set(-12, 0.02, -4);
        crossLine2.receiveShadow = true;
        this.scene.add(crossLine2);

        // 广场纹路 - 对角线
        const diagLine1Geometry = new THREE.PlaneGeometry(0.15, 10);
        const diagLine1 = new THREE.Mesh(diagLine1Geometry, crossLineMaterial);
        diagLine1.rotation.x = -Math.PI / 2;
        diagLine1.rotation.z = Math.PI / 4;
        diagLine1.position.set(-12, 0.02, -4);
        diagLine1.receiveShadow = true;
        this.scene.add(diagLine1);

        const diagLine2 = new THREE.Mesh(diagLine1Geometry, crossLineMaterial);
        diagLine2.rotation.x = -Math.PI / 2;
        diagLine2.rotation.z = -Math.PI / 4;
        diagLine2.position.set(-12, 0.02, -4);
        diagLine2.receiveShadow = true;
        this.scene.add(diagLine2);

        // 练功区（略微深色）- 村子右下角（新位置）
        const trainingGeometry = new THREE.PlaneGeometry(8, 8);
        const trainingMaterial = new THREE.MeshLambertMaterial({
            color: 0x2d4c2d
        });
        const training = new THREE.Mesh(trainingGeometry, trainingMaterial);
        training.rotation.x = -Math.PI / 2;
        training.position.set(-6, 0.01, -10);
        training.receiveShadow = true;
        this.scene.add(training);
    }

    /**
     * 创建围墙边界 - 地图边界墙 + 村子篱笆
     */
    createWalls() {
        // 1. 创建地图边界围墙（原先的围墙）
        const wallHeight = 3;
        const wallThickness = 1;
        const wallMaterial = new THREE.MeshLambertMaterial({
            color: 0x5c4033
        });

        // 创建四面墙
        const wallConfigs = [
            { w: this.width, h: wallThickness, x: 0, z: -this.height/2 - wallThickness/2 }, // 北
            { w: this.width, h: wallThickness, x: 0, z: this.height/2 + wallThickness/2 },  // 南
            { w: wallThickness, h: this.height, x: -this.width/2 - wallThickness/2, z: 0 }, // 西
            { w: wallThickness, h: this.height, x: this.width/2 + wallThickness/2, z: 0 }   // 东
        ];

        wallConfigs.forEach(config => {
            const geometry = new THREE.BoxGeometry(config.w, wallHeight, config.h);
            const wall = new THREE.Mesh(geometry, wallMaterial);
            wall.position.set(config.x, wallHeight / 2, config.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
            this.walls.push(wall);
        });

        // 2. 创建村子篱笆围墙（移动到地图左下角）
        // 村子范围定义（地图左下角区域）
        const villageMinX = -22;
        const villageMaxX = -2;
        const villageMinZ = -15;
        const villageMaxZ = 5;
        const fenceHeight = 2;
        const postHeight = 2.5;
        const fenceThickness = 0.15;

        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });

        // 创建篱笆围墙
        const fenceConfigs = [
            // 北边
            { startX: villageMinX, endX: villageMaxX, z: villageMinZ, isHorizontal: true },
            // 南边
            { startX: villageMinX, endX: villageMaxX, z: villageMaxZ, isHorizontal: true },
            // 西边
            { startZ: villageMinZ, endZ: villageMaxZ, x: villageMinX, isHorizontal: false },
            // 东边（留出门的位置）
            { startZ: villageMinZ, endZ: -6, x: villageMaxX, isHorizontal: false },
            { startZ: 0, endZ: villageMaxZ, x: villageMaxX, isHorizontal: false }
        ];

        fenceConfigs.forEach(config => {
            if (config.isHorizontal) {
                // 水平方向的篱笆
                const length = Math.abs(config.endX - config.startX);
                const numPosts = Math.floor(length / 2) + 1;

                for (let i = 0; i < numPosts; i++) {
                    const x = config.startX + i * 2;
                    // 木桩
                    const postGeometry = new THREE.BoxGeometry(0.2, postHeight, 0.2);
                    const post = new THREE.Mesh(postGeometry, postMaterial);
                    post.position.set(x, postHeight / 2, config.z);
                    post.castShadow = true;
                    this.scene.add(post);
                    this.walls.push(post);

                    // 横栏
                    if (i < numPosts - 1) {
                        const railGeometry = new THREE.BoxGeometry(2, 0.1, fenceThickness);
                        const rail1 = new THREE.Mesh(railGeometry, woodMaterial);
                        rail1.position.set(x + 1, postHeight * 0.7, config.z);
                        rail1.castShadow = true;
                        this.scene.add(rail1);
                        this.walls.push(rail1);

                        const rail2 = new THREE.Mesh(railGeometry, woodMaterial);
                        rail2.position.set(x + 1, postHeight * 0.4, config.z);
                        rail2.castShadow = true;
                        this.scene.add(rail2);
                        this.walls.push(rail2);
                    }
                }
            } else {
                // 垂直方向的篱笆
                const length = Math.abs(config.endZ - config.startZ);
                const numPosts = Math.floor(length / 2) + 1;

                for (let i = 0; i < numPosts; i++) {
                    const z = config.startZ + i * 2;
                    // 木桩
                    const postGeometry = new THREE.BoxGeometry(0.2, postHeight, 0.2);
                    const post = new THREE.Mesh(postGeometry, postMaterial);
                    post.position.set(config.x, postHeight / 2, z);
                    post.castShadow = true;
                    this.scene.add(post);
                    this.walls.push(post);

                    // 横栏
                    if (i < numPosts - 1) {
                        const railGeometry = new THREE.BoxGeometry(fenceThickness, 0.1, 2);
                        const rail1 = new THREE.Mesh(railGeometry, woodMaterial);
                        rail1.position.set(config.x, postHeight * 0.7, z + 1);
                        rail1.castShadow = true;
                        this.scene.add(rail1);
                        this.walls.push(rail1);

                        const rail2 = new THREE.Mesh(railGeometry, woodMaterial);
                        rail2.position.set(config.x, postHeight * 0.4, z + 1);
                        rail2.castShadow = true;
                        this.scene.add(rail2);
                        this.walls.push(rail2);
                    }
                }
            }
        });

        // 创建大门
        this.createVillageGate(villageMaxX, -3);
    }

    /**
     * 创建村庄大门 - 带牌匾
     */
    createVillageGate(x, z) {
        const gateWidth = 6;
        const gateHeight = 5;
        const pillarWidth = 0.8;

        const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

        // 左门柱
        const leftPillarGeometry = new THREE.BoxGeometry(pillarWidth, gateHeight, pillarWidth);
        const leftPillar = new THREE.Mesh(leftPillarGeometry, stoneMaterial);
        leftPillar.position.set(x, gateHeight / 2, z - gateWidth / 2);
        leftPillar.castShadow = true;
        this.scene.add(leftPillar);

        // 右门柱
        const rightPillar = new THREE.Mesh(leftPillarGeometry, stoneMaterial);
        rightPillar.position.set(x, gateHeight / 2, z + gateWidth / 2);
        rightPillar.castShadow = true;
        this.scene.add(rightPillar);

        // 门楣（横梁）
        const lintelGeometry = new THREE.BoxGeometry(1, 1.2, gateWidth + 1);
        const lintel = new THREE.Mesh(lintelGeometry, stoneMaterial);
        lintel.position.set(x, gateHeight, z);
        lintel.castShadow = true;
        this.scene.add(lintel);

        // 牌匾背景
        const signBgGeometry = new THREE.BoxGeometry(0.3, 1.5, 4);
        const signBgMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 }); // 深棕色木牌
        const signBg = new THREE.Mesh(signBgGeometry, signBgMaterial);
        signBg.position.set(x + 0.5, gateHeight, z);
        signBg.castShadow = true;
        this.scene.add(signBg);

        // 创建门楼文字"修仙村"
        this.createGateSign(x + 0.7, gateHeight, z);
    }

    /**
     * 创建门楼文字 - 牌匾上的修仙村
     */
    createGateSign(x, y, z) {
        // 使用简单的方块拼出文字效果
        const signMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 }); // 金色

        const charGroup = new THREE.Group();

        // "修"字 - 左偏旁（亻）
        const xiuLeft1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.05), signMaterial);
        xiuLeft1.position.set(0, 0, -0.8);
        charGroup.add(xiuLeft1);

        const xiuLeft2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.05), signMaterial);
        xiuLeft2.position.set(0.1, 0.2, -0.8);
        charGroup.add(xiuLeft2);

        // "修"字 - 右部分（彡）简化
        const xiuRight1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), signMaterial);
        xiuRight1.position.set(0.35, 0.3, -0.8);
        charGroup.add(xiuRight1);

        const xiuRight2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), signMaterial);
        xiuRight2.position.set(0.35, 0, -0.8);
        charGroup.add(xiuRight2);

        const xiuRight3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), signMaterial);
        xiuRight3.position.set(0.5, 0.15, -0.8);
        charGroup.add(xiuRight3);

        // "仙"字 - 左偏旁（亻）
        const xianLeft1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.05), signMaterial);
        xianLeft1.position.set(0, 0, 0);
        charGroup.add(xianLeft1);

        const xianLeft2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.05), signMaterial);
        xianLeft2.position.set(0.1, 0.2, 0);
        charGroup.add(xianLeft2);

        // "仙"字 - 右部分（山）
        const xianRight1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.05), signMaterial);
        xianRight1.position.set(0.35, -0.25, 0);
        charGroup.add(xianRight1);

        const xianRight2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.05), signMaterial);
        xianRight2.position.set(0.25, 0.05, 0);
        charGroup.add(xianRight2);

        const xianRight3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), signMaterial);
        xianRight3.position.set(0.45, 0, 0);
        charGroup.add(xianRight3);

        // "村"字 - 左偏旁（木）
        const cunLeft1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.05), signMaterial);
        cunLeft1.position.set(0, 0, 0.8);
        charGroup.add(cunLeft1);

        const cunLeft2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), signMaterial);
        cunLeft2.position.set(0.15, 0.1, 0.8);
        charGroup.add(cunLeft2);

        const cunLeft3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.05), signMaterial);
        cunLeft3.position.set(0.25, 0.1, 0.8);
        charGroup.add(cunLeft3);

        // "村"字 - 右部分（寸）
        const cunRight1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), signMaterial);
        cunRight1.position.set(0.5, 0.2, 0.8);
        charGroup.add(cunRight1);

        const cunRight2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), signMaterial);
        cunRight2.position.set(0.4, -0.05, 0.8);
        charGroup.add(cunRight2);

        const cunRight3 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.05), signMaterial);
        cunRight3.position.set(0.52, -0.25, 0.8);
        charGroup.add(cunRight3);

        // 整体位置调整
        charGroup.position.set(x, y, z);
        charGroup.rotation.y = Math.PI / 2;
        this.scene.add(charGroup);
    }

    /**
     * 创建建筑物（简单立方体）
     */
    createBuildings() {
        // 创建铁匠铺（带三角形房顶）- 移动到左下角
        this.createBlacksmithBuilding();

        // 创建医馆 - 移动到左下角
        this.createMedicalHall();

        // 创建修炼台 - 村子右下角（新位置）
        const trainingConfig = { name: '修炼台', x: -6, z: -10, w: 3, h: 1.5, d: 3, color: 0x4169e1 };
        const trainingGeometry = new THREE.BoxGeometry(trainingConfig.w, trainingConfig.h, trainingConfig.d);
        const trainingMaterial = new THREE.MeshLambertMaterial({
            color: trainingConfig.color
        });
        const trainingBuilding = new THREE.Mesh(trainingGeometry, trainingMaterial);
        trainingBuilding.position.set(trainingConfig.x, trainingConfig.h / 2, trainingConfig.z);
        trainingBuilding.castShadow = true;
        trainingBuilding.receiveShadow = true;
        trainingBuilding.userData = { type: 'building', entity: { name: trainingConfig.name } };
        this.scene.add(trainingBuilding);
        this.buildings.push(trainingBuilding);

        // 创建民居
        this.createHouses();

        // 添加一些装饰性的小物件
        this.createDecorations();
    }

    /**
     * 创建民居 - 2个，横向排列（x轴方向）
     */
    createHouses() {
        const houseConfigs = [
            { x: -18, z: 2, color: 0xdeb887, roofColor: 0x8b4513 },
            { x: -6, z: 2, color: 0xd2b48c, roofColor: 0xa0522d }
        ];

        houseConfigs.forEach((config, index) => {
            const houseGroup = new THREE.Group();

            // 房屋主体
            const bodyGeometry = new THREE.BoxGeometry(2.5, 2, 2.5);
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: config.color });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(0, 1, 0);
            body.castShadow = true;
            body.receiveShadow = true;
            houseGroup.add(body);

            // 三角形房顶
            const roofHeight = 1;
            const roofGeometry = new THREE.ConeGeometry(2, roofHeight, 4);
            const roofMaterial = new THREE.MeshLambertMaterial({ color: config.roofColor });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(0, 2 + roofHeight / 2, 0);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            houseGroup.add(roof);

            // 门
            const doorGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.6);
            const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(1.3, 0.6, 0);
            houseGroup.add(door);

            // 窗户
            const windowGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
            const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
            const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
            window1.position.set(1.3, 1.5, -0.6);
            houseGroup.add(window1);

            const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
            window2.position.set(1.3, 1.5, 0.6);
            houseGroup.add(window2);

            // 设置位置
            houseGroup.position.set(config.x, 0, config.z);
            houseGroup.userData = { type: 'building', entity: { name: `民居${index + 1}` } };

            this.scene.add(houseGroup);
            this.buildings.push(houseGroup);
        });
    }

    /**
     * 创建医馆 - 向右移动，避免篱笆穿过建筑
     */
    createMedicalHall() {
        const config = { name: '医馆', x: -10, z: 0, w: 3, h: 2, d: 2.5, color: 0xf5f5dc };

        // 创建房屋主体
        const bodyGeometry = new THREE.BoxGeometry(config.w, config.h, config.d);
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: config.color
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, config.h / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;

        // 创建三角形房顶
        const roofHeight = 1.25;
        const roofGeometry = new THREE.ConeGeometry(2.5, roofHeight, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({
            color: 0x228b22 // 绿色屋顶，代表医馆
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, config.h + roofHeight / 2, 0);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        roof.receiveShadow = true;

        // 创建医馆的门（右边）
        const doorGeometry = new THREE.BoxGeometry(0.1, 1.25, 0.75);
        const doorMaterial = new THREE.MeshLambertMaterial({
            color: 0x8b4513
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(config.w / 2 + 0.05, 0.625, 0);
        door.castShadow = true;
        door.receiveShadow = true;

        // 创建医馆招牌（红十字）
        const signBoardGeometry = new THREE.BoxGeometry(0.1, 0.4, 1);
        const signBoardMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff
        });
        const signBoard = new THREE.Mesh(signBoardGeometry, signBoardMaterial);
        signBoard.position.set(config.w / 2 + 0.1, config.h + 0.5, 0);

        // 红色十字 - 竖条
        const crossVGeometry = new THREE.BoxGeometry(0.025, 0.3, 0.15);
        const crossMaterial = new THREE.MeshLambertMaterial({
            color: 0xff0000
        });
        const crossV = new THREE.Mesh(crossVGeometry, crossMaterial);
        crossV.position.set(config.w / 2 + 0.175, config.h + 0.5, 0);

        // 红色十字 - 横条
        const crossHGeometry = new THREE.BoxGeometry(0.025, 0.15, 0.3);
        const crossH = new THREE.Mesh(crossHGeometry, crossMaterial);
        crossH.position.set(config.w / 2 + 0.175, config.h + 0.5, 0);

        // 创建药罐装饰
        const jarGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
        const jarMaterial = new THREE.MeshLambertMaterial({
            color: 0x8b4513
        });
        const jar1 = new THREE.Mesh(jarGeometry, jarMaterial);
        jar1.position.set(config.w / 2 + 0.25, 0.2, -1);
        jar1.castShadow = true;

        const jar2 = new THREE.Mesh(jarGeometry, jarMaterial);
        jar2.position.set(config.w / 2 + 0.25, 0.2, 1);
        jar2.castShadow = true;

        // 将所有部分组合成一个组
        const buildingGroup = new THREE.Group();
        buildingGroup.add(body);
        buildingGroup.add(roof);
        buildingGroup.add(door);
        buildingGroup.add(signBoard);
        buildingGroup.add(crossV);
        buildingGroup.add(crossH);
        buildingGroup.add(jar1);
        buildingGroup.add(jar2);

        // 设置Group的位置
        buildingGroup.position.set(config.x, 0, config.z);

        // 设置userData用于交互检测
        buildingGroup.userData = { type: 'building', entity: { name: config.name } };

        this.scene.add(buildingGroup);
        this.buildings.push(buildingGroup);
    }

    /**
     * 创建铁匠铺（带三角形房顶）- 向右移动，避免篱笆穿过建筑
     */
    createBlacksmithBuilding() {
        const config = { name: '铁匠铺', x: -10, z: -8, w: 2.5, h: 1.75, d: 2.5, color: 0x654321 };

        // 创建房屋主体
        const bodyGeometry = new THREE.BoxGeometry(config.w, config.h, config.d);
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: config.color
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, config.h / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;

        // 创建三角形房顶
        // 使用ConeGeometry创建三角锥，4个面就是三角形的屋顶
        const roofHeight = 1.25;
        const roofGeometry = new THREE.ConeGeometry(2.25, roofHeight, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({
            color: 0x8b4513 // 深棕色屋顶
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        // 房顶位置：在房屋主体上方，考虑高度偏移
        roof.position.set(0, config.h + roofHeight / 2, 0);
        // 旋转45度使四棱锥的面对准房屋四边
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        roof.receiveShadow = true;

        // 创建铁匠铺的烟囱
        const chimneyGeometry = new THREE.BoxGeometry(0.4, 1, 0.4);
        const chimneyMaterial = new THREE.MeshLambertMaterial({
            color: 0x4a4a4a // 灰色烟囱
        });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(0.75, config.h + roofHeight - 0.25, 0.75);
        chimney.castShadow = true;
        chimney.receiveShadow = true;

        // 创建铁匠铺的门（右边）
        const doorGeometry = new THREE.BoxGeometry(0.1, 1, 0.6);
        const doorMaterial = new THREE.MeshLambertMaterial({
            color: 0x3d2817 // 深棕色门
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(config.w / 2 + 0.05, 0.5, 0);
        door.castShadow = true;
        door.receiveShadow = true;

        // 创建门把手
        const handleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const handleMaterial = new THREE.MeshLambertMaterial({
            color: 0xffd700 // 金色把手
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(config.w / 2 + 0.125, 0.5, 0.2);

        // 将所有部分组合成一个组
        const buildingGroup = new THREE.Group();
        buildingGroup.add(body);
        buildingGroup.add(roof);
        buildingGroup.add(chimney);
        buildingGroup.add(door);
        buildingGroup.add(handle);

        // 设置Group的位置
        buildingGroup.position.set(config.x, 0, config.z);

        // 设置userData用于交互检测
        buildingGroup.userData = { type: 'building', entity: { name: config.name } };

        this.scene.add(buildingGroup);
        this.buildings.push(buildingGroup);
    }

    /**
     * 创建装饰物
     */
    createDecorations() {
        // 树木（圆锥 + 圆柱）- 移到野区的树
        const treePositions = [
            { x: 10, z: 18 },
            { x: -8, z: -8 },
            { x: 8, z: -10 },
            { x: 18, z: 5 },
            // 野区树木（兔妖区域附近）
            { x: -18, z: -12 },
            { x: -22, z: -12 },
            // 野区树木（木灵区域附近）
            { x: 18, z: -18 },
            { x: 22, z: -22 },
            // 野区树木（石魔区域附近）
            { x: -3, z: -20 },
            { x: 3, z: -20 }
        ];

        treePositions.forEach((pos, index) => {
            // 创建树的容器组
            const treeGroup = new THREE.Group();
            treeGroup.position.set(pos.x, 0, pos.z);

            // 树干
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(0, 0.75, 0);
            trunk.castShadow = true;
            treeGroup.add(trunk);

            // 树冠
            const crownGeometry = new THREE.ConeGeometry(1.5, 3, 8);
            const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.set(0, 3, 0);
            crown.castShadow = true;
            treeGroup.add(crown);

            // 添加 userData 用于悬停提示
            treeGroup.userData = { type: 'tree', entity: { name: '灵树' } };

            this.scene.add(treeGroup);
            this.decorations.push(treeGroup);
        });

        // 岩石
        const rockPositions = [
            { x: -22, z: -10, s: 1 },
            { x: 20, z: 15, s: 0.8 },
            { x: 5, z: -20, s: 1.2 }
        ];

        rockPositions.forEach(pos => {
            const geometry = new THREE.DodecahedronGeometry(pos.s);
            const material = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const rock = new THREE.Mesh(geometry, material);
            rock.position.set(pos.x, pos.s * 0.5, pos.z);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            rock.userData = { type: 'rock', entity: { name: '岩石' } };
            this.scene.add(rock);
            this.decorations.push(rock);
        });
    }

    /**
     * 创建NPC
     */
    createNPCs() {
        const npcConfigs = getVisibleNPCs();
        
        npcConfigs.forEach(config => {
            const npc = new NPC(config.id);
            const mesh = npc.createMesh();
            
            this.scene.add(mesh);
            
            if (npc.glowMesh) {
                this.scene.add(npc.glowMesh);
            }
            
            this.npcs.push(npc);
        });
        
        console.log(`创建了 ${this.npcs.length} 个NPC`);
    }

    /**
     * 创建怪物
     */
    createMonsters() {
        this.monsterSpawns.forEach(spawn => {
            spawn.positions.forEach(pos => {
                const monster = new Monster(spawn.monsterId, pos);
                const mesh = monster.createMesh();
                
                this.scene.add(mesh);
                this.monsters.push(monster);
            });
        });
        
        console.log(`创建了 ${this.monsters.length} 个怪物`);
    }

    /**
     * 更新场景
     */
    update(deltaTime, player) {
        // 更新NPC
        this.npcs.forEach(npc => {
            npc.update(deltaTime);
        });
        
        // 更新怪物
        const attackResults = [];
        this.monsters.forEach(monster => {
            const result = monster.update(deltaTime, player);
            if (result && result.type === 'attack') {
                attackResults.push(result);
            }
        });
        
        return attackResults;
    }

    /**
     * 获取可选中的对象
     */
    getSelectableObjects() {
        const objects = [];

        this.npcs.forEach(npc => {
            if (npc.mesh) objects.push(npc.mesh);
        });

        this.monsters.forEach(monster => {
            if (monster.mesh && !monster.isDead) objects.push(monster.mesh);
        });

        return objects;
    }

    /**
     * 获取所有可交互的对象（包括装饰物）
     */
    getAllInteractableObjects() {
        const objects = [];

        // NPC
        this.npcs.forEach(npc => {
            if (npc.mesh) objects.push(npc.mesh);
        });

        // 怪物
        this.monsters.forEach(monster => {
            if (monster.mesh && !monster.isDead) objects.push(monster.mesh);
        });

        // 建筑物
        this.buildings.forEach(building => {
            objects.push(building);
        });

        // 装饰物（树、岩石等）
        this.decorations.forEach(decoration => {
            objects.push(decoration);
        });

        return objects;
    }

    /**
     * 获取存活的怪物
     */
    getAliveMonsters() {
        return this.monsters.filter(m => !m.isDead);
    }

    /**
     * 获取NPC
     */
    getNPC(npcId) {
        return this.npcs.find(npc => npc.id === npcId);
    }

    /**
     * 检查位置是否在边界内
     */
    isInBounds(x, z) {
        return x >= this.bounds.minX && x <= this.bounds.maxX &&
               z >= this.bounds.minZ && z <= this.bounds.maxZ;
    }

    /**
     * 约束位置到边界内
     */
    clampToBounds(position) {
        return {
            x: Math.max(this.bounds.minX + 1, Math.min(this.bounds.maxX - 1, position.x)),
            z: Math.max(this.bounds.minZ + 1, Math.min(this.bounds.maxZ - 1, position.z))
        };
    }

    /**
     * 检查与建筑物的碰撞
     * 返回碰撞的建筑物信息，如果没有碰撞则返回null
     */
    checkBuildingCollision(position, playerRadius = 0.5) {
        for (const building of this.buildings) {
            const config = building.userData.entity;

            // 获取建筑物的尺寸（支持Group和Mesh）
            let width, depth;
            if (building.geometry && building.geometry.parameters) {
                // 单个Mesh
                width = building.geometry.parameters.width;
                depth = building.geometry.parameters.depth;
            } else if (building.children && building.children.length > 0) {
                // Group，使用第一个子元素（通常是主体）的尺寸
                const bodyMesh = building.children.find(child =>
                    child.geometry && child.geometry.parameters && child.geometry.parameters.width
                );
                if (bodyMesh) {
                    width = bodyMesh.geometry.parameters.width;
                    depth = bodyMesh.geometry.parameters.depth;
                } else {
                    continue;
                }
            } else {
                continue;
            }

            // 获取建筑物的边界（考虑玩家半径）
            const halfWidth = width / 2 + playerRadius;
            const halfDepth = depth / 2 + playerRadius;

            const minX = building.position.x - halfWidth;
            const maxX = building.position.x + halfWidth;
            const minZ = building.position.z - halfDepth;
            const maxZ = building.position.z + halfDepth;

            // 检查玩家位置是否在建筑物范围内
            if (position.x >= minX && position.x <= maxX &&
                position.z >= minZ && position.z <= maxZ) {
                return {
                    building: building,
                    name: config.name,
                    minX: minX,
                    maxX: maxX,
                    minZ: minZ,
                    maxZ: maxZ,
                    centerX: building.position.x,
                    centerZ: building.position.z
                };
            }
        }
        return null;
    }

    /**
     * 将位置推出建筑物
     * 返回修正后的位置
     */
    resolveBuildingCollision(position, collision) {
        // 计算到建筑物各边的距离
        const distToLeft = position.x - collision.minX;
        const distToRight = collision.maxX - position.x;
        const distToTop = position.z - collision.minZ;
        const distToBottom = collision.maxZ - position.z;
        
        // 找到最小的距离，从该方向推出
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        const newPosition = { ...position };
        
        if (minDist === distToLeft) {
            newPosition.x = collision.minX - 0.1;
        } else if (minDist === distToRight) {
            newPosition.x = collision.maxX + 0.1;
        } else if (minDist === distToTop) {
            newPosition.z = collision.minZ - 0.1;
        } else {
            newPosition.z = collision.maxZ + 0.1;
        }
        
        return newPosition;
    }
}
