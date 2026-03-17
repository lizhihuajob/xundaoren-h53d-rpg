/**
 * 寻道人 - 新手村场景
 * 包含地形、建筑、NPC和怪物
 */

import NPC from '../entities/NPC.js';
import Monster from '../entities/Monster.js';
import { getVisibleNPCs } from '../data/npcs.js';

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
        
        // 村庄广场（棋盘格样式）- 移动到地图西南角
        const plazaWidth = 16;
        const plazaDepth = 12;
        const plazaX = -18; // 西南角X坐标
        const plazaZ = 18;  // 西南角Z坐标
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

        // 广场边缘装饰
        const borderWidth = 0.5;
        const borderDepth = plazaDepth + 1;
        const borderPositions = [
            { x: plazaX - plazaWidth / 2 - borderWidth / 2, z: plazaZ },
            { x: plazaX + plazaWidth / 2 + borderWidth / 2, z: plazaZ }
        ];
        
        borderPositions.forEach(pos => {
            const borderGeometry = new THREE.PlaneGeometry(borderWidth, borderDepth);
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

    /**
     * 创建篱笆围墙
     */
    createWalls() {
        this.createBorderWalls();
        this.createVillageFence();
    }

    createBorderWalls() {
        const wallHeight = 1;
        const wallThickness = 0.5;
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x808080,
            transparent: true,
            opacity: 0.3
        });
        
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        const createBorder = (x, z, w, h, d, isVertical) => {
            const geo = new THREE.BoxGeometry(isVertical ? wallThickness : w, wallHeight, isVertical ? d : wallThickness);
            const mesh = new THREE.Mesh(geo, wallMaterial);
            mesh.position.set(
                isVertical ? x : x + w / 2,
                wallHeight / 2,
                isVertical ? z + d / 2 : z
            );
            this.scene.add(mesh);
        };
        
        createBorder(-halfWidth, -halfHeight, this.width, wallHeight, this.height, false);
        createBorder(-halfWidth, halfHeight, this.width, wallHeight, this.height, false);
        createBorder(-halfWidth, -halfHeight, wallThickness, wallHeight, this.height, true);
        createBorder(halfWidth, -halfHeight, wallThickness, wallHeight, this.height, true);
    }

    createVillageFence() {
        const fenceHeight = 2;
        const fenceThickness = 0.5;
        const fenceMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513 
        });
        
        const gateWidth = 5;
        const villageMinX = -25;
        const villageMaxX = 5;
        const villageMinZ = -5;
        const villageMaxZ = 20;
        const villageWidth = villageMaxX - villageMinX;
        const villageDepth = villageMaxZ - villageMinZ;
        
        this.createFenceSegment(villageMinX, villageMinZ, villageWidth, fenceHeight, fenceThickness, fenceMaterial);
        this.createFenceSegment(villageMinX, villageMaxZ, villageWidth, fenceHeight, fenceThickness, fenceMaterial);
        this.createFenceSegment(villageMinX, villageMinZ, fenceThickness, fenceHeight, villageDepth, fenceMaterial, true);
        
        const eastWallLength = (villageDepth - gateWidth) / 2;
        this.createFenceSegment(villageMaxX, villageMinZ, fenceThickness, fenceHeight, eastWallLength, fenceMaterial, true);
        this.createFenceSegment(villageMaxX, villageMaxZ - eastWallLength, fenceThickness, fenceHeight, eastWallLength, fenceMaterial, true);
        
        // 创建大门柱子
        const postHeight = 2.5;
        const postGeometry = new THREE.BoxGeometry(0.6, postHeight, 0.6);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(villageMaxX, postHeight / 2, villageMinZ + eastWallLength);
        leftPost.castShadow = true;
        this.scene.add(leftPost);
        this.walls.push(leftPost);
        
        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(villageMaxX, postHeight / 2, villageMaxZ - eastWallLength);
        rightPost.castShadow = true;
        this.scene.add(rightPost);
        this.walls.push(rightPost);
        
        // 创建大门横梁
        const beamGeometry = new THREE.BoxGeometry(fenceThickness, 0.3, gateWidth);
        const beam = new THREE.Mesh(beamGeometry, postMaterial);
        beam.position.set(villageMaxX, postHeight - 0.15, villageMinZ + villageDepth / 2);
        beam.castShadow = true;
        this.scene.add(beam);
        this.walls.push(beam);
    }
    
    /**
     * 创建篱笆段
     */
    createFenceSegment(x, z, width, height, depth, material, isVertical = false) {
        const fenceGroup = new THREE.Group();
        const postSpacing = 2;
        const postGeometry = new THREE.BoxGeometry(0.3, height, 0.3);
        const railGeometry = new THREE.BoxGeometry(isVertical ? 0.1 : width, 0.2, isVertical ? depth : 0.1);
        
        if (isVertical) {
            const numPosts = Math.floor(depth / postSpacing) + 1;
            for (let i = 0; i < numPosts; i++) {
                const post = new THREE.Mesh(postGeometry, material);
                post.position.set(x, height / 2, z + i * postSpacing);
                post.castShadow = true;
                fenceGroup.add(post);
            }
            
            const rail1 = new THREE.Mesh(railGeometry, material);
            rail1.position.set(x, height * 0.3, z + depth / 2);
            rail1.castShadow = true;
            fenceGroup.add(rail1);
            
            const rail2 = new THREE.Mesh(railGeometry, material);
            rail2.position.set(x, height * 0.7, z + depth / 2);
            rail2.castShadow = true;
            fenceGroup.add(rail2);
        } else {
            const numPosts = Math.floor(width / postSpacing) + 1;
            for (let i = 0; i < numPosts; i++) {
                const post = new THREE.Mesh(postGeometry, material);
                post.position.set(x + i * postSpacing, height / 2, z);
                post.castShadow = true;
                fenceGroup.add(post);
            }
            
            const rail1 = new THREE.Mesh(railGeometry, material);
            rail1.position.set(x + width / 2, height * 0.3, z);
            rail1.castShadow = true;
            fenceGroup.add(rail1);
            
            const rail2 = new THREE.Mesh(railGeometry, material);
            rail2.position.set(x + width / 2, height * 0.7, z);
            rail2.castShadow = true;
            fenceGroup.add(rail2);
        }
        
        const colliderWidth = isVertical ? 0.5 : width;
        const colliderDepth = isVertical ? depth : 0.5;
        const colliderGeometry = new THREE.BoxGeometry(colliderWidth, height, colliderDepth);
        const colliderMaterial = new THREE.MeshBasicMaterial({ visible: false });
        const collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        collider.position.set(
            isVertical ? x : x + width / 2,
            height / 2,
            isVertical ? z + depth / 2 : z
        );
        fenceGroup.add(collider);
        
        fenceGroup.userData = { type: 'wall', entity: { name: '篱笆墙' } };
        this.scene.add(fenceGroup);
        this.walls.push(fenceGroup);
    }

    /**
     * 创建建筑物（简单立方体）
     */
    createBuildings() {
        // 创建铁匠铺（带三角形房顶）
        this.createBlacksmithBuilding();

        // 创建医馆
        this.createMedicalHall();

        // 创建五边形修炼台
        this.createTrainingPlatform();

        // 添加一些装饰性的小物件
        this.createDecorations();
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
     * 创建五边形修炼台
     */
    createTrainingPlatform() {
        const config = { name: '修炼台', x: -6, z: 12, baseRadius: 3, layerHeight: 0.6, numLayers: 3, color: 0x4169e1 };
        const platformGroup = new THREE.Group();

        for (let i = 0; i < config.numLayers; i++) {
            const radius = config.baseRadius - (i * 0.8);
            const yPos = i * config.layerHeight + config.layerHeight / 2;

            const layerGeometry = new THREE.CylinderGeometry(radius, radius, config.layerHeight, 5);
            const layerMaterial = new THREE.MeshLambertMaterial({
                color: config.color,
                emissive: 0x112244,
                emissiveIntensity: 0.2
            });
            const layer = new THREE.Mesh(layerGeometry, layerMaterial);
            layer.position.y = yPos;
            layer.castShadow = true;
            layer.receiveShadow = true;
            platformGroup.add(layer);
        }

        platformGroup.position.set(config.x, 0, config.z);
        platformGroup.userData = { type: 'building', entity: { name: config.name } };
        this.scene.add(platformGroup);
        this.buildings.push(platformGroup);
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
        const collidables = [...this.buildings, ...this.walls];
        for (const building of collidables) {
            const config = building.userData?.entity || { name: '障碍物' };

            // 获取建筑物的尺寸（支持Group和Mesh）
            let width, depth;
            if (building.geometry && building.geometry.parameters) {
                // 单个Mesh
                width = building.geometry.parameters.width;
                depth = building.geometry.parameters.depth;
            } else if (building.children && building.children.length > 0) {
                // Group，优先使用不可见碰撞体（完整尺寸），否则使用第一个有尺寸的子元素
                let bodyMesh = building.children.find(child =>
                    child.material && child.material.visible === false
                );
                if (!bodyMesh) {
                    bodyMesh = building.children.find(child =>
                        child.geometry && child.geometry.parameters && child.geometry.parameters.width
                    );
                }
                if (bodyMesh) {
                    width = bodyMesh.geometry.parameters.width;
                    depth = bodyMesh.geometry.parameters.depth;
                } else {
                    continue;
                }
            } else {
                continue;
            }

            if (width === undefined || depth === undefined) continue;

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
