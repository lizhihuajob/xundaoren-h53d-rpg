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
        
        // 中央广场（带纹路装饰）- 村子中心
        this.createPlaza(-15, -17.5);
        
        // 练功区（略微深色）
        const trainingGeometry = new THREE.PlaneGeometry(15, 15);
        const trainingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2d4c2d
        });
        const training = new THREE.Mesh(trainingGeometry, trainingMaterial);
        training.rotation.x = -Math.PI / 2;
        training.position.set(-18, 0.01, -18);
        training.receiveShadow = true;
        this.scene.add(training);
    }

    /**
     * 创建带纹路的广场
     */
    createPlaza(centerX, centerZ) {
        const plazaGroup = new THREE.Group();
        plazaGroup.position.set(centerX, 0, centerZ);

        // 广场底层 - 八边形石板
        const baseGeometry = new THREE.CircleGeometry(8, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({
            color: 0xa0a0a0
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.rotation.x = -Math.PI / 2;
        base.position.y = 0.01;
        base.receiveShadow = true;
        plazaGroup.add(base);

        // 内圈装饰环
        const innerRingGeometry = new THREE.RingGeometry(5, 5.5, 8);
        const innerRingMaterial = new THREE.MeshLambertMaterial({
            color: 0x888888,
            side: THREE.DoubleSide
        });
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.y = 0.02;
        plazaGroup.add(innerRing);

        // 外圈装饰环
        const outerRingGeometry = new THREE.RingGeometry(7, 7.5, 8);
        const outerRingMaterial = new THREE.MeshLambertMaterial({
            color: 0x707070,
            side: THREE.DoubleSide
        });
        const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRing.rotation.x = -Math.PI / 2;
        outerRing.position.y = 0.02;
        plazaGroup.add(outerRing);

        // 中心太极图案
        // 外圆
        const taijiOuterGeometry = new THREE.CircleGeometry(2, 32);
        const taijiOuterMaterial = new THREE.MeshLambertMaterial({
            color: 0x505050
        });
        const taijiOuter = new THREE.Mesh(taijiOuterGeometry, taijiOuterMaterial);
        taijiOuter.rotation.x = -Math.PI / 2;
        taijiOuter.position.y = 0.03;
        plazaGroup.add(taijiOuter);

        // 阴半圆（黑色）
        const yinGeometry = new THREE.CircleGeometry(2, 32, 0, Math.PI);
        const yinMaterial = new THREE.MeshLambertMaterial({
            color: 0x303030
        });
        const yin = new THREE.Mesh(yinGeometry, yinMaterial);
        yin.rotation.x = -Math.PI / 2;
        yin.position.y = 0.035;
        plazaGroup.add(yin);

        // 阳半圆（白色）
        const yangGeometry = new THREE.CircleGeometry(2, 32, Math.PI, Math.PI);
        const yangMaterial = new THREE.MeshLambertMaterial({
            color: 0xd0d0d0
        });
        const yang = new THREE.Mesh(yangGeometry, yangMaterial);
        yang.rotation.x = -Math.PI / 2;
        yang.position.y = 0.035;
        plazaGroup.add(yang);

        // 小阴点（在阳中）
        const smallYinGeometry = new THREE.CircleGeometry(0.5, 16);
        const smallYin = new THREE.Mesh(smallYinGeometry, yinMaterial);
        smallYin.rotation.x = -Math.PI / 2;
        smallYin.position.set(0, 0.04, 1);
        plazaGroup.add(smallYin);

        // 小阳点（在阴中）
        const smallYangGeometry = new THREE.CircleGeometry(0.5, 16);
        const smallYang = new THREE.Mesh(smallYangGeometry, yangMaterial);
        smallYang.rotation.x = -Math.PI / 2;
        smallYang.position.set(0, 0.04, -1);
        plazaGroup.add(smallYang);

        // 放射线装饰（从中心向外辐射）
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const lineGeometry = new THREE.PlaneGeometry(0.2, 5);
            const lineMaterial = new THREE.MeshLambertMaterial({
                color: 0x606060,
                side: THREE.DoubleSide
            });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.rotation.z = angle;
            line.position.set(Math.sin(angle) * 5.5, 0.025, Math.cos(angle) * 5.5);
            plazaGroup.add(line);
        }

        this.scene.add(plazaGroup);
    }

    /**
     * 创建围墙边界
     */
    createWalls() {
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

        // 创建村子篱笆
        this.createVillageFence();
    }

    /**
     * 创建村子篱笆和大门
     */
    createVillageFence() {
        // 村子范围：左下角，x从-25到-5，z从-25到-10（纵向宽度缩小）
        const villageMinX = -25;
        const villageMaxX = -5;
        const villageMinZ = -25;
        const villageMaxZ = -10;
        
        // 篱笆参数
        const fenceHeight = 1.5;
        const postSpacing = 2;
        const postRadius = 0.1;
        const railHeight = 0.8;
        
        // 创建篱笆柱子
        const createFencePost = (x, z) => {
            const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius * 1.2, fenceHeight, 8);
            const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(x, fenceHeight / 2, z);
            post.castShadow = true;
            post.receiveShadow = true;
            return post;
        };

        // 创建篱笆横杆
        const createFenceRail = (x1, z1, x2, z2, height) => {
            const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
            const railGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
            const railMaterial = new THREE.MeshLambertMaterial({ color: 0xa0522d });
            const rail = new THREE.Mesh(railGeometry, railMaterial);
            
            rail.position.set((x1 + x2) / 2, height, (z1 + z2) / 2);
            rail.rotation.z = Math.PI / 2;
            
            const angle = Math.atan2(z2 - z1, x2 - x1);
            rail.rotation.y = -angle;
            
            rail.castShadow = true;
            return rail;
        };

        // 大门位置（右侧中间）
        const gateMinZ = -20;
        const gateMaxZ = -15;

        // 北面篱笆（z = villageMinZ）
        for (let x = villageMinX; x <= villageMaxX; x += postSpacing) {
            this.scene.add(createFencePost(x, villageMinZ));
            if (x < villageMaxX) {
                this.scene.add(createFenceRail(x, villageMinZ, x + postSpacing, villageMinZ, railHeight));
                this.scene.add(createFenceRail(x, villageMinZ, x + postSpacing, villageMinZ, fenceHeight - 0.2));
            }
        }

        // 南面篱笆（z = villageMaxZ）
        for (let x = villageMinX; x <= villageMaxX; x += postSpacing) {
            this.scene.add(createFencePost(x, villageMaxZ));
            if (x < villageMaxX) {
                this.scene.add(createFenceRail(x, villageMaxZ, x + postSpacing, villageMaxZ, railHeight));
                this.scene.add(createFenceRail(x, villageMaxZ, x + postSpacing, villageMaxZ, fenceHeight - 0.2));
            }
        }

        // 西面篱笆（x = villageMinX）
        for (let z = villageMinZ; z <= villageMaxZ; z += postSpacing) {
            this.scene.add(createFencePost(villageMinX, z));
            if (z < villageMaxZ) {
                this.scene.add(createFenceRail(villageMinX, z, villageMinX, z + postSpacing, railHeight));
                this.scene.add(createFenceRail(villageMinX, z, villageMinX, z + postSpacing, fenceHeight - 0.2));
            }
        }

        // 东面篱笆（x = villageMaxX）- 带大门
        // 大门下方
        for (let z = villageMinZ; z <= gateMinZ; z += postSpacing) {
            this.scene.add(createFencePost(villageMaxX, z));
            if (z < gateMinZ) {
                this.scene.add(createFenceRail(villageMaxX, z, villageMaxX, z + postSpacing, railHeight));
                this.scene.add(createFenceRail(villageMaxX, z, villageMaxX, z + postSpacing, fenceHeight - 0.2));
            }
        }
        // 大门上方
        for (let z = gateMaxZ; z <= villageMaxZ; z += postSpacing) {
            this.scene.add(createFencePost(villageMaxX, z));
            if (z < villageMaxZ) {
                this.scene.add(createFenceRail(villageMaxX, z, villageMaxX, z + postSpacing, railHeight));
                this.scene.add(createFenceRail(villageMaxX, z, villageMaxX, z + postSpacing, fenceHeight - 0.2));
            }
        }

        // 创建大门
        this.createVillageGate(villageMaxX, -17.5);
    }

    /**
     * 创建村子大门
     */
    createVillageGate(x, z) {
        const gateGroup = new THREE.Group();
        gateGroup.position.set(x, 0, z);

        // 门柱
        const pillarHeight = 3;
        const pillarWidth = 0.6;
        const pillarDepth = 0.6;
        const pillarSpacing = 5;

        // 左门柱
        const leftPillarGeometry = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarDepth);
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const leftPillar = new THREE.Mesh(leftPillarGeometry, pillarMaterial);
        leftPillar.position.set(0, pillarHeight / 2, -pillarSpacing / 2);
        leftPillar.castShadow = true;
        leftPillar.receiveShadow = true;
        gateGroup.add(leftPillar);

        // 右门柱
        const rightPillar = new THREE.Mesh(leftPillarGeometry, pillarMaterial);
        rightPillar.position.set(0, pillarHeight / 2, pillarSpacing / 2);
        rightPillar.castShadow = true;
        rightPillar.receiveShadow = true;
        gateGroup.add(rightPillar);

        // 门楼横梁
        const beamGeometry = new THREE.BoxGeometry(pillarWidth * 1.5, 0.4, pillarSpacing + pillarWidth);
        const beamMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(0, pillarHeight + 0.2, 0);
        beam.castShadow = true;
        beam.receiveShadow = true;
        gateGroup.add(beam);

        // 门楼屋顶
        const roofGeometry = new THREE.BoxGeometry(pillarWidth * 2, 0.3, pillarSpacing + pillarWidth + 0.5);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, pillarHeight + 0.55, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        gateGroup.add(roof);

        // 创建"修仙村"牌匾
        this.createGateSign(gateGroup, pillarHeight);

        // 门框装饰
        const frameGeometry = new THREE.BoxGeometry(0.1, pillarHeight, 0.1);
        const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        
        const frame1 = new THREE.Mesh(frameGeometry, frameMaterial);
        frame1.position.set(0.3, pillarHeight / 2, -pillarSpacing / 2 + 0.3);
        gateGroup.add(frame1);

        const frame2 = new THREE.Mesh(frameGeometry, frameMaterial);
        frame2.position.set(0.3, pillarHeight / 2, pillarSpacing / 2 - 0.3);
        gateGroup.add(frame2);

        this.scene.add(gateGroup);
    }

    /**
     * 创建大门牌匾
     */
    createGateSign(gateGroup, pillarHeight) {
        // 牌匾底板
        const signWidth = 3;
        const signHeight = 0.8;
        const signDepth = 0.15;
        
        const signGeometry = new THREE.BoxGeometry(signDepth, signHeight, signWidth);
        const signMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0.3, pillarHeight - 0.5, 0);
        sign.castShadow = true;
        gateGroup.add(sign);

        // 牌匾边框
        const borderMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        
        // 上边框
        const topBorderGeometry = new THREE.BoxGeometry(signDepth + 0.05, 0.08, signWidth + 0.1);
        const topBorder = new THREE.Mesh(topBorderGeometry, borderMaterial);
        topBorder.position.set(0.3, pillarHeight - 0.1, 0);
        gateGroup.add(topBorder);

        // 下边框
        const bottomBorder = new THREE.Mesh(topBorderGeometry, borderMaterial);
        bottomBorder.position.set(0.3, pillarHeight - 0.9, 0);
        gateGroup.add(bottomBorder);

        // 左边框
        const leftBorderGeometry = new THREE.BoxGeometry(signDepth + 0.05, signHeight, 0.08);
        const leftBorder = new THREE.Mesh(leftBorderGeometry, borderMaterial);
        leftBorder.position.set(0.3, pillarHeight - 0.5, -signWidth / 2 - 0.05);
        gateGroup.add(leftBorder);

        // 右边框
        const rightBorder = new THREE.Mesh(leftBorderGeometry, borderMaterial);
        rightBorder.position.set(0.3, pillarHeight - 0.5, signWidth / 2 + 0.05);
        gateGroup.add(rightBorder);

        // 使用Canvas创建"修仙村"文字纹理
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 绘制金色文字
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('修仙村', canvas.width / 2, canvas.height / 2);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // 创建文字平面
        const textGeometry = new THREE.PlaneGeometry(signWidth - 0.2, signHeight - 0.15);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0.4, pillarHeight - 0.5, 0);
        textMesh.rotation.y = Math.PI / 2;
        gateGroup.add(textMesh);
    }

    /**
     * 创建建筑物（简单立方体）
     */
    createBuildings() {
        // 创建铁匠铺（带三角形房顶）- 移动到左下角
        this.createBlacksmithBuilding();

        // 创建医馆 - 移动到左下角
        this.createMedicalHall();

        // 创建修炼台 - 放到村子右下角
        const trainingConfig = { name: '修炼台', x: -10, z: -20, w: 4, h: 2, d: 4, color: 0x4169e1 };
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
     * 创建民居
     */
    createHouses() {
        // 民居放到村子右上角，横向排列
        const houseConfigs = [
            { name: '民居一', x: -12, z: -12, w: 2, h: 1.5, d: 2, color: 0xdeb887, roofColor: 0x8b4513 },
            { name: '民居二', x: -8, z: -12, w: 2, h: 1.5, d: 2, color: 0xd2b48c, roofColor: 0x8b4513 }
        ];

        houseConfigs.forEach(config => {
            const houseGroup = new THREE.Group();

            // 房屋主体
            const bodyGeometry = new THREE.BoxGeometry(config.w, config.h, config.d);
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: config.color });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(0, config.h / 2, 0);
            body.castShadow = true;
            body.receiveShadow = true;
            houseGroup.add(body);

            // 三角形房顶
            const roofHeight = 1;
            const roofGeometry = new THREE.ConeGeometry(Math.max(config.w, config.d) * 0.8, roofHeight, 4);
            const roofMaterial = new THREE.MeshLambertMaterial({ color: config.roofColor });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(0, config.h + roofHeight / 2, 0);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            roof.receiveShadow = true;
            houseGroup.add(roof);

            // 门
            const doorGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.5);
            const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(config.w / 2 + 0.05, 0.4, 0);
            houseGroup.add(door);

            houseGroup.position.set(config.x, 0, config.z);
            houseGroup.userData = { type: 'building', entity: { name: config.name } };

            this.scene.add(houseGroup);
            this.buildings.push(houseGroup);
        });
    }

    /**
     * 创建医馆
     */
    createMedicalHall() {
        const config = { name: '医馆', x: -20, z: -20, w: 3, h: 2, d: 2.5, color: 0xf5f5dc };

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
     * 创建铁匠铺（带三角形房顶）
     */
    createBlacksmithBuilding() {
        const config = { name: '铁匠铺', x: -20, z: -23, w: 2.5, h: 1.75, d: 2.5, color: 0x654321 };

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
