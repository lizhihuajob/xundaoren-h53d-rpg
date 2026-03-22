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
            ]},
            // 村庄东面空地的野怪
            { monsterId: 'rabbitDemon', positions: [
                { x: 8, y: 0, z: 10 },
                { x: 12, y: 0, z: 12 },
                { x: 10, y: 0, z: 8 }
            ]},
            { monsterId: 'woodSpirit', positions: [
                { x: 15, y: 0, z: 15 },
                { x: 18, y: 0, z: 10 }
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
        
        // 村庄广场（棋盘格样式）- 扩大到包含医馆、铁匠铺和修炼场
        // 建筑物位置：医馆(-22, 12)、铁匠铺(-16, 12)、修炼场(-8, 12)
        // 广场需要覆盖从 x=-24 到 x=-4 (宽度20)，z=8 到 z=20 (深度12)
        const plazaWidth = 24;  // 扩大到包含所有建筑物
        const plazaDepth = 16;  // 增加深度
        const plazaX = -14;     // 中心点X坐标，覆盖 -26 到 -2
        const plazaZ = 14;      // 中心点Z坐标，覆盖 6 到 22
        const plazaGeometry = new THREE.PlaneGeometry(plazaWidth, plazaDepth);
        const plazaMaterial = new THREE.MeshLambertMaterial({
            color: 0x707070
        });
        const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
        plaza.rotation.x = -Math.PI / 2;
        plaza.position.set(plazaX, 0.01, plazaZ);
        plaza.receiveShadow = true;
        this.scene.add(plaza);

        // 广场棋盘格纹路
        const gridRows = 4; // 纵向格子数
        const gridCols = 6; // 横向格子数
        const cellWidth = plazaWidth / gridCols;
        const cellDepth = plazaDepth / gridRows;

        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                // 棋盘格效果：交替颜色
                const isDark = (row + col) % 2 === 1;
                const cellGeometry = new THREE.PlaneGeometry(cellWidth, cellDepth);
                const cellMaterial = new THREE.MeshLambertMaterial({
                    color: isDark ? 0x505050 : 0x606060
                });
                const cell = new THREE.Mesh(cellGeometry, cellMaterial);
                cell.rotation.x = -Math.PI / 2;
                cell.position.set(
                    plazaX - plazaWidth / 2 + cellWidth * (col + 0.5),
                    0.02,
                    plazaZ - plazaDepth / 2 + cellDepth * (row + 0.5)
                );
                cell.receiveShadow = true;
                this.scene.add(cell);
            }
        }

        // 广场边缘装饰 - 四边
        const borderWidth = 0.5;
        // 左右边框
        const borderPositionsH = [
            { x: plazaX - plazaWidth / 2 - borderWidth / 2, z: plazaZ, w: borderWidth, d: plazaDepth },
            { x: plazaX + plazaWidth / 2 + borderWidth / 2, z: plazaZ, w: borderWidth, d: plazaDepth }
        ];
        // 上下边框
        const borderPositionsV = [
            { x: plazaX, z: plazaZ - plazaDepth / 2 - borderWidth / 2, w: plazaWidth + borderWidth * 2, d: borderWidth },
            { x: plazaX, z: plazaZ + plazaDepth / 2 + borderWidth / 2, w: plazaWidth + borderWidth * 2, d: borderWidth }
        ];

        [...borderPositionsH, ...borderPositionsV].forEach(pos => {
            const borderGeometry = new THREE.PlaneGeometry(pos.w, pos.d);
            const borderMaterial = new THREE.MeshLambertMaterial({
                color: 0x4a4a4a
            });
            const border = new THREE.Mesh(borderGeometry, borderMaterial);
            border.rotation.x = -Math.PI / 2;
            border.position.set(pos.x, 0.015, pos.z);
            border.receiveShadow = true;
            this.scene.add(border);
        });
        
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

    createWalls() {
        this.createBoundaryWalls();
        this.createVillageFence();
    }

    createBoundaryWalls() {
        const wallHeight = 3;
        const wallThickness = 1;
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x5c4033 
        });
        
        const wallConfigs = [
            { w: this.width, h: wallThickness, x: 0, z: -this.height/2 - wallThickness/2 },
            { w: this.width, h: wallThickness, x: 0, z: this.height/2 + wallThickness/2 },
            { w: wallThickness, h: this.height, x: -this.width/2 - wallThickness/2, z: 0 },
            { w: wallThickness, h: this.height, x: this.width/2 + wallThickness/2, z: 0 }
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
    }

    createVillageFence() {
        const fenceHeight = 1.5;
        const postRadius = 0.15;
        const railHeight = 0.6;
        const railThickness = 0.08;
        const gapBetweenPosts = 1.5;

        const villageBounds = {
            minX: -26,
            maxX: 0,
            minZ: 6,
            maxZ: 24
        };

        this.fenceBounds = villageBounds;

        const gateWidth = 3;
        const gateCenterX = villageBounds.maxX;
        const gateCenterZ = (villageBounds.minZ + villageBounds.maxZ) / 2;

        this.gatePosition = { x: gateCenterX + 1, z: gateCenterZ };

        const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });

        const createFencePost = (x, z) => {
            const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius * 1.2, fenceHeight, 8);
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(x, fenceHeight / 2, z);
            post.castShadow = true;
            post.receiveShadow = true;
            post.userData = { type: 'fence' };
            this.scene.add(post);
            this.walls.push(post);
            return { x, z };
        };

        const createFenceRail = (x1, z1, x2, z2, height) => {
            const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
            const railGeometry = new THREE.BoxGeometry(length, railThickness, railThickness);
            const rail = new THREE.Mesh(railGeometry, fenceMaterial);
            rail.position.set((x1 + x2) / 2, height, (z1 + z2) / 2);
            rail.rotation.y = Math.atan2(z2 - z1, x2 - x1);
            rail.castShadow = true;
            rail.receiveShadow = true;
            rail.userData = { type: 'fence' };
            this.scene.add(rail);
            this.walls.push(rail);
        };

        const createFenceSection = (startX, startZ, endX, endZ, skipGate = false, gateStart = 0, gateEnd = 0) => {
            const length = Math.sqrt((endX - startX) ** 2 + (endZ - startZ) ** 2);
            const numPosts = Math.floor(length / gapBetweenPosts) + 1;
            const posts = [];

            for (let i = 0; i <= numPosts; i++) {
                const t = i / numPosts;
                const x = startX + (endX - startX) * t;
                const z = startZ + (endZ - startZ) * t;

                if (skipGate) {
                    if (z >= gateStart && z <= gateEnd) {
                        continue;
                    }
                }

                posts.push(createFencePost(x, z));
            }

            for (let i = 0; i < posts.length - 1; i++) {
                const z1 = posts[i].z;
                const z2 = posts[i + 1].z;
                
                const skipThis = skipGate && 
                    ((z1 >= gateStart && z1 <= gateEnd) || (z2 >= gateStart && z2 <= gateEnd) ||
                     (Math.min(z1, z2) < gateStart && Math.max(z1, z2) > gateEnd));
                
                if (!skipThis) {
                    createFenceRail(posts[i].x, posts[i].z, posts[i + 1].x, posts[i + 1].z, railHeight);
                    createFenceRail(posts[i].x, posts[i].z, posts[i + 1].x, posts[i + 1].z, fenceHeight - railHeight);
                }
            }
        };

        createFenceSection(villageBounds.minX, villageBounds.minZ, villageBounds.maxX, villageBounds.minZ);
        createFenceSection(villageBounds.minX, villageBounds.maxZ, villageBounds.maxX, villageBounds.maxZ);
        createFenceSection(villageBounds.minX, villageBounds.minZ, villageBounds.minX, villageBounds.maxZ);
        
        const gateStart = gateCenterZ - gateWidth / 2;
        const gateEnd = gateCenterZ + gateWidth / 2;
        createFenceSection(villageBounds.maxX, villageBounds.minZ, villageBounds.maxX, villageBounds.maxZ, true, gateStart, gateEnd);

        this.createGate(gateCenterX, gateCenterZ, gateWidth);
    }

    createGate(x, z, width) {
        const pillarHeight = 2.5;
        const pillarRadius = 0.25;

        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });

        const pillarGeometry = new THREE.CylinderGeometry(pillarRadius, pillarRadius * 1.3, pillarHeight, 8);
        
        const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        leftPillar.position.set(x, pillarHeight / 2, z - width / 2);
        leftPillar.castShadow = true;
        leftPillar.receiveShadow = true;
        this.scene.add(leftPillar);
        this.walls.push(leftPillar);

        const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        rightPillar.position.set(x, pillarHeight / 2, z + width / 2);
        rightPillar.castShadow = true;
        rightPillar.receiveShadow = true;
        this.scene.add(rightPillar);
        this.walls.push(rightPillar);

        const archHeight = 0.4;
        const archGeometry = new THREE.BoxGeometry(0.3, archHeight, width + pillarRadius * 2);
        const archMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const arch = new THREE.Mesh(archGeometry, archMaterial);
        arch.position.set(x, pillarHeight + archHeight / 2, z);
        arch.castShadow = true;
        arch.receiveShadow = true;
        this.scene.add(arch);
        this.walls.push(arch);

        this.createGateSign(x, z, pillarHeight + archHeight);
    }

    createGateSign(x, z, signHeight) {
        const createSignTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#8b4513';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 64px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('新手村', canvas.width / 2, canvas.height / 2);

            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 6;
            ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

            return new THREE.CanvasTexture(canvas);
        };

        const signGeometry = new THREE.PlaneGeometry(2.5, 0.6);
        
        const frontTexture = createSignTexture();
        const frontMaterial = new THREE.MeshBasicMaterial({ 
            map: frontTexture,
            side: THREE.FrontSide
        });
        const signFront = new THREE.Mesh(signGeometry, frontMaterial);
        signFront.position.set(x + 0.15, signHeight + 0.4, z);
        signFront.rotation.y = Math.PI / 2;
        this.scene.add(signFront);
        this.walls.push(signFront);

        const backTexture = createSignTexture();
        const backMaterial = new THREE.MeshBasicMaterial({ 
            map: backTexture,
            side: THREE.FrontSide
        });
        const signBack = new THREE.Mesh(signGeometry, backMaterial);
        signBack.position.set(x - 0.15, signHeight + 0.4, z);
        signBack.rotation.y = -Math.PI / 2;
        this.scene.add(signBack);
        this.walls.push(signBack);
    }

    /**
     * 创建建筑物（简单立方体）
     */
    createBuildings() {
        // 创建铁匠铺（带三角形房顶）
        this.createBlacksmithBuilding();

        // 创建医馆
        this.createMedicalHall();

        // 创建修炼场 - 五边形，高度为0（地面装饰）
        this.createTrainingGround();

        // 添加一些装饰性的小物件
        this.createDecorations();
    }

    createTrainingGround() {
        const config = { name: '修炼场', x: -8, z: 12, width: 5, depth: 5 };
        
        const groundGeometry = new THREE.PlaneGeometry(config.width, config.depth);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x4169e1,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(config.x, 0.02, config.z);
        ground.receiveShadow = true;
        ground.userData = { type: 'building', entity: { name: config.name } };
        this.scene.add(ground);
        this.buildings.push(ground);

        const gridRows = 3;
        const gridCols = 3;
        const cellWidth = config.width / gridCols;
        const cellDepth = config.depth / gridRows;

        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const isDark = (row + col) % 2 === 1;
                const cellGeometry = new THREE.PlaneGeometry(cellWidth, cellDepth);
                const cellMaterial = new THREE.MeshLambertMaterial({
                    color: isDark ? 0x3a5fcf : 0x5a7fef,
                    side: THREE.DoubleSide
                });
                const cell = new THREE.Mesh(cellGeometry, cellMaterial);
                cell.rotation.x = -Math.PI / 2;
                cell.position.set(
                    config.x - config.width / 2 + cellWidth * (col + 0.5),
                    0.025,
                    config.z - config.depth / 2 + cellDepth * (row + 0.5)
                );
                cell.receiveShadow = true;
                this.scene.add(cell);
            }
        }

        const borderWidth = 0.3;
        const borderMaterial = new THREE.MeshLambertMaterial({
            color: 0x2a4faf,
            side: THREE.DoubleSide
        });

        const borderPositions = [
            { x: config.x - config.width / 2 - borderWidth / 2, z: config.z, w: borderWidth, d: config.depth },
            { x: config.x + config.width / 2 + borderWidth / 2, z: config.z, w: borderWidth, d: config.depth },
            { x: config.x, z: config.z - config.depth / 2 - borderWidth / 2, w: config.width + borderWidth * 2, d: borderWidth },
            { x: config.x, z: config.z + config.depth / 2 + borderWidth / 2, w: config.width + borderWidth * 2, d: borderWidth }
        ];

        borderPositions.forEach(pos => {
            const borderGeometry = new THREE.PlaneGeometry(pos.w, pos.d);
            const border = new THREE.Mesh(borderGeometry, borderMaterial);
            border.rotation.x = -Math.PI / 2;
            border.position.set(pos.x, 0.015, pos.z);
            border.receiveShadow = true;
            this.scene.add(border);
        });

        this.trainingGroundPosition = { x: config.x, z: config.z };
    }

    /**
     * 创建医馆
     */
    createMedicalHall() {
        // 医馆在广场北侧边缘，大门向南（朝向广场）
        const config = { name: '医馆', x: -22, z: 12, w: 3, h: 2, d: 2.5, color: 0xf5f5dc };

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

        // 创建医馆的门（南边，朝向广场）
        const doorGeometry = new THREE.BoxGeometry(0.75, 1.25, 0.1);
        const doorMaterial = new THREE.MeshLambertMaterial({
            color: 0x8b4513
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 0.625, config.d / 2 + 0.05);
        door.castShadow = true;
        door.receiveShadow = true;

        // 创建医馆招牌（红十字）- 放在门上方
        const signBoardGeometry = new THREE.BoxGeometry(1, 0.4, 0.1);
        const signBoardMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff
        });
        const signBoard = new THREE.Mesh(signBoardGeometry, signBoardMaterial);
        signBoard.position.set(0, config.h + 0.5, config.d / 2 + 0.1);

        // 红色十字 - 竖条
        const crossVGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.025);
        const crossMaterial = new THREE.MeshLambertMaterial({
            color: 0xff0000
        });
        const crossV = new THREE.Mesh(crossVGeometry, crossMaterial);
        crossV.position.set(0, config.h + 0.5, config.d / 2 + 0.175);

        // 红色十字 - 横条
        const crossHGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.025);
        const crossH = new THREE.Mesh(crossHGeometry, crossMaterial);
        crossH.position.set(0, config.h + 0.5, config.d / 2 + 0.175);

        // 创建药罐装饰
        const jarGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
        const jarMaterial = new THREE.MeshLambertMaterial({
            color: 0x8b4513
        });
        const jar1 = new THREE.Mesh(jarGeometry, jarMaterial);
        jar1.position.set(-1, 0.2, config.d / 2 + 0.25);
        jar1.castShadow = true;

        const jar2 = new THREE.Mesh(jarGeometry, jarMaterial);
        jar2.position.set(1, 0.2, config.d / 2 + 0.25);
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
        // 铁匠铺在广场北侧边缘，与医馆并排，大门向南（朝向广场）
        const config = { name: '铁匠铺', x: -16, z: 12, w: 2.5, h: 1.75, d: 2.5, color: 0x654321 };

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

        // 创建铁匠铺的门（南边，朝向广场）
        const doorGeometry = new THREE.BoxGeometry(0.6, 1, 0.1);
        const doorMaterial = new THREE.MeshLambertMaterial({
            color: 0x3d2817 // 深棕色门
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 0.5, config.d / 2 + 0.05);
        door.castShadow = true;
        door.receiveShadow = true;

        // 创建门把手
        const handleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const handleMaterial = new THREE.MeshLambertMaterial({
            color: 0xffd700 // 金色把手
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0.2, 0.5, config.d / 2 + 0.125);

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
        // 只保留野区（怪物区域）的树木和石头，村子里完全不放

        // 树木（圆锥 + 圆柱）- 只分布在野区（怪物区域）
        const treePositions = [
            // 野区树木（兔妖区域附近 - 西北方向）
            { x: -18, z: -12 },
            { x: -22, z: -12 },
            { x: -20, z: -8 },
            { x: -24, z: -5 },
            { x: -12, z: -18 },
            { x: -15, z: -15 },
            { x: -18, z: -5 },
            // 野区树木（木灵区域附近 - 东北方向）
            { x: 18, z: -18 },
            { x: 22, z: -22 },
            { x: 20, z: -15 },
            { x: 24, z: -18 },
            { x: 16, z: -12 },
            { x: 18, z: -12 },
            // 野区树木（石魔区域附近 - 正北方向）
            { x: -3, z: -20 },
            { x: 3, z: -20 },
            { x: 0, z: -24 },
            { x: -6, z: -22 },
            { x: 6, z: -22 },
            { x: -8, z: -20 },
            { x: 8, z: -20 },
            // 村庄东面空地的树木
            { x: 6, z: 6 },
            { x: 10, z: 5 },
            { x: 14, z: 8 },
            { x: 18, z: 6 },
            { x: 8, z: 14 },
            { x: 12, z: 18 },
            { x: 16, z: 12 },
            { x: 20, z: 16 }
        ];

        treePositions.forEach((pos, index) => {
            // 随机大小变化
            const scale = 0.8 + Math.random() * 0.4;
            // 随机旋转
            const rotation = Math.random() * Math.PI * 2;

            // 创建树的容器组
            const treeGroup = new THREE.Group();
            treeGroup.position.set(pos.x, 0, pos.z);
            treeGroup.rotation.y = rotation;
            treeGroup.scale.set(scale, scale, scale);

            // 树干
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(0, 0.75, 0);
            trunk.castShadow = true;
            treeGroup.add(trunk);

            // 树冠 - 使用不同深浅的绿色
            const crownGeometry = new THREE.ConeGeometry(1.5, 3, 8);
            const greenShades = [0x228b22, 0x2e8b57, 0x3cb371, 0x006400];
            const crownColor = greenShades[Math.floor(Math.random() * greenShades.length)];
            const crownMaterial = new THREE.MeshLambertMaterial({ color: crownColor });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.set(0, 3, 0);
            crown.castShadow = true;
            treeGroup.add(crown);

            // 添加 userData 用于悬停提示
            treeGroup.userData = { type: 'tree', entity: { name: '灵树' } };

            this.scene.add(treeGroup);
            this.decorations.push(treeGroup);
        });

        // 岩石 - 只分布在野区（怪物区域）
        const rockPositions = [
            // 兔妖区域岩石（西北野区）
            { x: -22, z: -10, s: 1 },
            { x: -20, z: -14, s: 0.8 },
            { x: -24, z: -15, s: 1.2 },
            { x: -18, z: -5, s: 0.5 },
            { x: -16, z: -8, s: 0.6 },
            // 木灵区域岩石（东北野区）
            { x: 20, z: -15, s: 0.8 },
            { x: 22, z: -18, s: 1 },
            { x: 18, z: -12, s: 0.6 },
            { x: 24, z: -20, s: 0.9 },
            // 石魔区域岩石（正北野区，更多更大的岩石）
            { x: 5, z: -20, s: 1.2 },
            { x: -2, z: -22, s: 1.5 },
            { x: 2, z: -24, s: 1 },
            { x: -5, z: -18, s: 0.8 },
            { x: 8, z: -22, s: 1.3 },
            // 村庄东面空地的岩石
            { x: 5, z: 8, s: 0.7 },
            { x: 9, z: 12, s: 0.9 },
            { x: 13, z: 6, s: 0.6 },
            { x: 17, z: 14, s: 1.0 },
            { x: 21, z: 8, s: 0.8 },
            { x: 7, z: 16, s: 0.5 }
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

        // 小石头 - 只散落在野区
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 30;
            const z = -5 - Math.random() * 20; // 只在北侧野区生成 (z < -5)

            const size = 0.1 + Math.random() * 0.25;
            const geometry = new THREE.DodecahedronGeometry(size);
            const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
            const stone = new THREE.Mesh(geometry, material);
            stone.position.set(x, size * 0.3, z);
            stone.rotation.set(Math.random(), Math.random(), Math.random());
            stone.castShadow = true;
            this.scene.add(stone);
            this.decorations.push(stone);
        }

        // 草丛装饰 - 只分布在野区
        for (let i = 0; i < 25; i++) {
            const x = (Math.random() - 0.5) * 35;
            const z = -5 - Math.random() * 22; // 只在北侧野区生成 (z < -5)

            const grassGroup = new THREE.Group();
            grassGroup.position.set(x, 0, z);

            // 创建几簇草叶
            for (let j = 0; j < 3 + Math.floor(Math.random() * 3); j++) {
                const grassGeometry = new THREE.ConeGeometry(0.05, 0.3 + Math.random() * 0.2, 4);
                const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c4a });
                const grass = new THREE.Mesh(grassGeometry, grassMaterial);
                grass.position.set(
                    (Math.random() - 0.5) * 0.3,
                    0,
                    (Math.random() - 0.5) * 0.3
                );
                grass.rotation.y = Math.random() * Math.PI * 2;
                grass.rotation.z = (Math.random() - 0.5) * 0.3;
                grassGroup.add(grass);
            }

            this.scene.add(grassGroup);
            this.decorations.push(grassGroup);
        }
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
            
            // 添加头顶名称标签到场景
            if (npc.nameLabel) {
                this.scene.add(npc.nameLabel);
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
    update(deltaTime, player, camera) {
        // 更新NPC
        this.npcs.forEach(npc => {
            npc.update(deltaTime);
            
            // 更新名称标签朝向，使其始终面向相机
            if (npc.nameLabel && camera) {
                npc.nameLabel.lookAt(camera.position);
            }
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
     * 检查与篱笆的碰撞
     * 返回碰撞信息，如果没有碰撞则返回null
     * 严格检测：玩家完全不能穿过篱笆，只能从大门通过
     */
    checkFenceCollision(position, playerRadius = 0.5) {
        if (!this.fenceBounds) return null;

        const fb = this.fenceBounds;
        const gateCenterZ = (fb.minZ + fb.maxZ) / 2;
        const gateHalfWidth = 1.5;
        
        // 玩家碰撞盒
        const playerMinX = position.x - playerRadius;
        const playerMaxX = position.x + playerRadius;
        const playerMinZ = position.z - playerRadius;
        const playerMaxZ = position.z + playerRadius;

        // 判断玩家当前是在篱笆内部还是外部
        const isInsideVillage = position.x >= fb.minX && position.x <= fb.maxX &&
                                position.z >= fb.minZ && position.z <= fb.maxZ;

        // 左边篱笆（西侧）- 严格检测玩家碰撞盒是否与篱笆边界重叠
        if (playerMaxX >= fb.minX && playerMinX <= fb.minX &&
            playerMaxZ >= fb.minZ && playerMinZ <= fb.maxZ) {
            return {
                name: '篱笆',
                type: 'left',
                fenceX: fb.minX,
                isInsideVillage: isInsideVillage,
                pushDirection: isInsideVillage ? -1 : 1  // -1向左推，1向右推
            };
        }

        // 右边篱笆（东侧，有大门）
        if (playerMinX <= fb.maxX && playerMaxX >= fb.maxX &&
            playerMaxZ >= fb.minZ && playerMinZ <= fb.maxZ) {
            // 检查是否在大门位置（给大门更宽的范围）
            const isAtGate = position.z >= gateCenterZ - gateHalfWidth - playerRadius && 
                            position.z <= gateCenterZ + gateHalfWidth + playerRadius;
            if (!isAtGate) {
                return {
                    name: '篱笆',
                    type: 'right',
                    fenceX: fb.maxX,
                    isInsideVillage: isInsideVillage,
                    pushDirection: isInsideVillage ? 1 : -1
                };
            }
        }

        // 下边篱笆（南侧）
        if (playerMaxZ >= fb.minZ && playerMinZ <= fb.minZ &&
            playerMaxX >= fb.minX && playerMinX <= fb.maxX) {
            return {
                name: '篱笆',
                type: 'bottom',
                fenceZ: fb.minZ,
                isInsideVillage: isInsideVillage,
                pushDirection: isInsideVillage ? -1 : 1
            };
        }

        // 上边篱笆（北侧）
        if (playerMinZ <= fb.maxZ && playerMaxZ >= fb.maxZ &&
            playerMaxX >= fb.minX && playerMinX <= fb.maxX) {
            return {
                name: '篱笆',
                type: 'top',
                fenceZ: fb.maxZ,
                isInsideVillage: isInsideVillage,
                pushDirection: isInsideVillage ? 1 : -1
            };
        }

        return null;
    }

    /**
     * 将位置推出篱笆
     * 返回修正后的位置
     * 使用严格的边界限制，确保玩家无法穿过
     */
    resolveFenceCollision(position, collision) {
        const newPosition = { ...position };
        const playerRadius = 0.5;
        const safetyMargin = 0.05; // 额外的安全边距

        switch (collision.type) {
            case 'left':
                // 左边篱笆：根据pushDirection决定推出方向
                newPosition.x = collision.pushDirection < 0 ? 
                    collision.fenceX - playerRadius - safetyMargin : 
                    collision.fenceX + playerRadius + safetyMargin;
                break;
            case 'right':
                // 右边篱笆
                newPosition.x = collision.pushDirection > 0 ? 
                    collision.fenceX + playerRadius + safetyMargin : 
                    collision.fenceX - playerRadius - safetyMargin;
                break;
            case 'bottom':
                // 下边篱笆（南侧）
                newPosition.z = collision.pushDirection < 0 ? 
                    collision.fenceZ - playerRadius - safetyMargin : 
                    collision.fenceZ + playerRadius + safetyMargin;
                break;
            case 'top':
                // 上边篱笆（北侧）
                newPosition.z = collision.pushDirection > 0 ? 
                    collision.fenceZ + playerRadius + safetyMargin : 
                    collision.fenceZ - playerRadius - safetyMargin;
                break;
        }

        return newPosition;
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
