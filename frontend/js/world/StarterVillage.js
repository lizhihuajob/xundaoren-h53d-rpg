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
    }

    /**
     * 创建建筑物（简单立方体）
     */
    createBuildings() {
        // 创建铁匠铺（带三角形房顶）
        this.createBlacksmithBuilding();

        // 创建医馆
        this.createMedicalHall();

        // 创建修炼台（五边形，带台阶）
        this.createTrainingPlatform();

        // 创建村庄篱笆
        this.createVillageFence();

        // 添加一些装饰性的小物件
        this.createDecorations();
    }

    /**
     * 创建修炼台（多层五边形叠加，大的在下小的在上，带台阶）
     * 位置：医馆和铁匠铺附近
     * 台阶朝向南面（朝向广场）
     */
    createTrainingPlatform() {
        const config = {
            name: '修炼台',
            x: -6,
            z: 12,
            sides: 5,
            layers: [
                { radius: 3.5, height: 0.4, color: 0x4169e1 },
                { radius: 2.8, height: 0.35, color: 0x3a5fcd },
                { radius: 2.1, height: 0.3, color: 0x2e4dbd },
                { radius: 1.4, height: 0.25, color: 0x2240ad },
                { radius: 0.7, height: 0.2, color: 0x1633a0 }
            ]
        };
        
        const platformGroup = new THREE.Group();
        platformGroup.position.set(config.x, 0, config.z);
        
        let currentHeight = 0;
        
        config.layers.forEach((layer, index) => {
            const layerMaterial = new THREE.MeshLambertMaterial({
                color: layer.color,
                emissive: new THREE.Color(layer.color).multiplyScalar(0.1)
            });
            
            const layerGeometry = new THREE.CylinderGeometry(
                layer.radius,
                layer.radius,
                layer.height,
                config.sides
            );
            const layerMesh = new THREE.Mesh(layerGeometry, layerMaterial);
            layerMesh.position.y = currentHeight + layer.height / 2;
            layerMesh.rotation.y = Math.PI / config.sides;
            layerMesh.castShadow = true;
            layerMesh.receiveShadow = true;
            platformGroup.add(layerMesh);
            
            const edgeGeometry = new THREE.TorusGeometry(layer.radius, 0.06, 8, config.sides);
            const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            edge.rotation.x = Math.PI / 2;
            edge.rotation.z = Math.PI / config.sides;
            edge.position.y = currentHeight + layer.height;
            platformGroup.add(edge);
            
            currentHeight += layer.height;
        });
        
        const topRadius = config.layers[config.layers.length - 1].radius;
        
        const centerGeometry = new THREE.CircleGeometry(0.4, config.sides);
        const centerMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.6
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.rotation.x = -Math.PI / 2;
        center.rotation.z = Math.PI / config.sides;
        center.position.y = currentHeight + 0.01;
        platformGroup.add(center);
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x6699ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const glowRingGeometry = new THREE.RingGeometry(topRadius - 0.1, topRadius + 0.2, config.sides);
        const glowRing = new THREE.Mesh(glowRingGeometry, glowMaterial);
        glowRing.rotation.x = -Math.PI / 2;
        glowRing.rotation.z = Math.PI / config.sides;
        glowRing.position.y = currentHeight + 0.02;
        platformGroup.add(glowRing);
        
        const stepMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5fcd });
        const stepEdgeMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        const bottomRadius = config.layers[0].radius;
        const stepCount = 5;
        const stepWidth = 2;
        const stepDepth = 0.5;
        const stepHeight = currentHeight / stepCount;
        const stepStartZ = bottomRadius + 0.3;
        
        for (let i = 0; i < stepCount; i++) {
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(0, stepHeight * (i + 0.5), stepStartZ + stepDepth * i);
            step.castShadow = true;
            step.receiveShadow = true;
            platformGroup.add(step);
            
            const stepEdgeGeometry = new THREE.BoxGeometry(stepWidth + 0.1, 0.05, 0.1);
            const stepEdge = new THREE.Mesh(stepEdgeGeometry, stepEdgeMaterial);
            stepEdge.position.set(0, stepHeight * (i + 1), stepStartZ + stepDepth * i);
            platformGroup.add(stepEdge);
        }
        
        platformGroup.userData = { type: 'building', entity: { name: config.name } };
        
        this.scene.add(platformGroup);
        this.buildings.push(platformGroup);
        
        console.log('修炼台创建完成（多层五边形叠加，带台阶）');
    }

    /**
     * 创建村庄篱笆
     * 村庄广场中心：X = -18, Z = 18
     * 修炼台位置：X = -6, Z = 12
     * 坐标系：X轴西(-) ← → 东(+)，Z轴南(-) ← → 北(+)
     * 大门设在东面
     * 篱笆需要包围村庄广场和修炼台
     */
    createVillageFence() {
        const plazaWidth = 16;
        const plazaDepth = 12;
        const plazaX = -18;
        const plazaZ = 18;
        
        const trainingPlatformX = -6;
        const trainingPlatformZ = 12;
        const trainingPlatformRadius = 3.5;
        
        const fenceHeight = 1.2;
        const postSpacing = 2;
        const postRadius = 0.08;
        const railHeight = 0.6;
        
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const darkWoodMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        const fenceBounds = {
            minX: plazaX - plazaWidth / 2 - 1,
            maxX: Math.max(plazaX + plazaWidth / 2 + 1, trainingPlatformX + trainingPlatformRadius + 1.5),
            minZ: Math.min(plazaZ - plazaDepth / 2 - 1, trainingPlatformZ - trainingPlatformRadius - 1.5),
            maxZ: plazaZ + plazaDepth / 2 + 1
        };
        
        const gateWidth = 3;
        const gateX = fenceBounds.maxX;
        const gateZ = plazaZ;
        
        const createFencePost = (x, z, isCorner = false) => {
            const height = isCorner ? fenceHeight + 0.3 : fenceHeight;
            const geometry = new THREE.CylinderGeometry(postRadius, postRadius * 1.2, height, 8);
            const post = new THREE.Mesh(geometry, isCorner ? darkWoodMaterial : woodMaterial);
            post.position.set(x, height / 2, z);
            post.castShadow = true;
            post.receiveShadow = true;
            return post;
        };
        
        const createFenceRail = (x1, z1, x2, z2, height) => {
            const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
            const geometry = new THREE.BoxGeometry(length, 0.08, 0.05);
            const rail = new THREE.Mesh(geometry, woodMaterial);
            
            const midX = (x1 + x2) / 2;
            const midZ = (z1 + z2) / 2;
            rail.position.set(midX, height, midZ);
            
            const angle = Math.atan2(z2 - z1, x2 - x1);
            rail.rotation.y = -angle;
            
            rail.castShadow = true;
            rail.receiveShadow = true;
            return rail;
        };
        
        const createGatePost = (x, z) => {
            const group = new THREE.Group();
            
            const postGeometry = new THREE.CylinderGeometry(0.12, 0.15, fenceHeight + 0.5, 8);
            const post = new THREE.Mesh(postGeometry, darkWoodMaterial);
            post.position.set(0, (fenceHeight + 0.5) / 2, 0);
            post.castShadow = true;
            group.add(post);
            
            const topGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const top = new THREE.Mesh(topGeometry, darkWoodMaterial);
            top.position.set(0, fenceHeight + 0.5 + 0.1, 0);
            top.castShadow = true;
            group.add(top);
            
            group.position.set(x, 0, z);
            return group;
        };
        
        const fenceGroup = new THREE.Group();
        fenceGroup.userData = { type: 'fence', entity: { name: '村庄篱笆' } };
        
        const posts = [];
        const rails = [];
        
        const northSide = [];
        for (let x = fenceBounds.minX; x <= fenceBounds.maxX; x += postSpacing) {
            northSide.push({ x, z: fenceBounds.maxZ });
        }
        if (northSide[northSide.length - 1].x < fenceBounds.maxX) {
            northSide.push({ x: fenceBounds.maxX, z: fenceBounds.maxZ });
        }
        
        const southSide = [];
        for (let x = fenceBounds.minX; x <= fenceBounds.maxX; x += postSpacing) {
            southSide.push({ x, z: fenceBounds.minZ });
        }
        if (southSide[southSide.length - 1].x < fenceBounds.maxX) {
            southSide.push({ x: fenceBounds.maxX, z: fenceBounds.minZ });
        }
        
        const westSide = [];
        for (let z = fenceBounds.minZ + postSpacing; z < fenceBounds.maxZ; z += postSpacing) {
            westSide.push({ x: fenceBounds.minX, z });
        }
        
        const gateMinZ = gateZ - gateWidth / 2;
        const gateMaxZ = gateZ + gateWidth / 2;
        
        const eastSideNorth = [];
        for (let z = gateMaxZ + postSpacing; z < fenceBounds.maxZ; z += postSpacing) {
            eastSideNorth.push({ x: fenceBounds.maxX, z });
        }
        if (eastSideNorth.length === 0 || eastSideNorth[eastSideNorth.length - 1].z < fenceBounds.maxZ - 0.1) {
            if (gateMaxZ + postSpacing < fenceBounds.maxZ) {
                eastSideNorth.push({ x: fenceBounds.maxX, z: fenceBounds.maxZ });
            }
        }
        
        const eastSideSouth = [];
        for (let z = fenceBounds.minZ + postSpacing; z < gateMinZ; z += postSpacing) {
            eastSideSouth.push({ x: fenceBounds.maxX, z });
        }
        
        const addFenceSection = (points, hasGate = false) => {
            for (let i = 0; i < points.length; i++) {
                const isCorner = i === 0 || i === points.length - 1;
                const post = createFencePost(points[i].x, points[i].z, isCorner);
                fenceGroup.add(post);
                posts.push(post);
                
                if (i < points.length - 1) {
                    const rail1 = createFenceRail(
                        points[i].x, points[i].z,
                        points[i + 1].x, points[i + 1].z,
                        railHeight
                    );
                    const rail2 = createFenceRail(
                        points[i].x, points[i].z,
                        points[i + 1].x, points[i + 1].z,
                        fenceHeight - 0.2
                    );
                    fenceGroup.add(rail1);
                    fenceGroup.add(rail2);
                    rails.push(rail1, rail2);
                }
            }
        };
        
        addFenceSection(northSide);
        addFenceSection(southSide);
        addFenceSection(westSide);
        addFenceSection(eastSideNorth);
        addFenceSection(eastSideSouth);
        
        const gatePostNorth = createGatePost(gateX, gateMaxZ);
        const gatePostSouth = createGatePost(gateX, gateMinZ);
        fenceGroup.add(gatePostNorth);
        fenceGroup.add(gatePostSouth);
        
        if (eastSideNorth.length > 0) {
            const lastPostNorth = eastSideNorth[eastSideNorth.length - 1];
            const rail1 = createFenceRail(lastPostNorth.x, lastPostNorth.z, gateX, gateMaxZ, railHeight);
            const rail2 = createFenceRail(lastPostNorth.x, lastPostNorth.z, gateX, gateMaxZ, fenceHeight - 0.2);
            fenceGroup.add(rail1);
            fenceGroup.add(rail2);
        }
        
        if (eastSideSouth.length > 0) {
            const lastPostSouth = eastSideSouth[eastSideSouth.length - 1];
            const rail1 = createFenceRail(lastPostSouth.x, lastPostSouth.z, gateX, gateMinZ, railHeight);
            const rail2 = createFenceRail(lastPostSouth.x, lastPostSouth.z, gateX, gateMinZ, fenceHeight - 0.2);
            fenceGroup.add(rail1);
            fenceGroup.add(rail2);
        }
        
        const gateArchGeometry = new THREE.BoxGeometry(0.15, 0.15, gateWidth + 0.3);
        const gateArch = new THREE.Mesh(gateArchGeometry, darkWoodMaterial);
        gateArch.position.set(gateX, fenceHeight + 0.3, gateZ);
        gateArch.castShadow = true;
        fenceGroup.add(gateArch);
        
        this.scene.add(fenceGroup);
        this.decorations.push(fenceGroup);
        
        this.gatePosition = { x: gateX + 1, y: 0, z: gateZ };
        
        console.log('村庄篱笆创建完成，大门位于东面');
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
