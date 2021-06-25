import './styles.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/orbitcontrols'
import loadGrassTextures from './config/GrassTexture'
import { loadCannonTextures } from './config/CannonTextures'
import { loadBaseTextures } from './config/BaseTexures'
import Ball from './physics/ball'
import { loadModels } from './config/Models'
import { loadTargetTextues } from './config/targetTexure'
import { CylinderBufferGeometry, MeshBasicMaterial, MeshNormalMaterial, PlaneBufferGeometry } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import gsap from 'gsap'
import World from './physics/world'
import { loadFlagBaseTextures } from './config/flagBaseTextures'
import flagVertexShader from './shaders/FlagSheders/vertex.glsl'
import flagFragmentShader from './shaders/FlagSheders/fragment.glsl'
import { loadFlagTexture } from './config/FlagTexture'
import vector from './physics/vector'
/*
    Variables
*/
const gui = new dat.GUI()
const size = {
    width: window.innerWidth,
    height: window.innerHeight
}
const mouse = new THREE.Vector2();
const cannonDirection = new THREE.Vector3()
const scene = new THREE.Scene()
const GRAVITY = 9.8, DRAG_COEFF = 0.47
const HEIGHT = 0, TEMPERETURE = 15; // celsius
const WIND_SPEED = 10, WIND_ANGLE = -Math.PI / 2
const LIFT_COEFF = 0.1
const RESISTANSE_COEFF = 0.1, FRICTION_COEFF = 0.1
const SHOOT_DELAY = 1000
let lastShotingTime = 0
let numberOfBalls = 20
let score = 0
/*
    Paramters
*/
const paramters = {
    windSpeed: 10,
    windAngle: Math.PI/2
}

/*
    Loaders
*/
const loadingBar = document.querySelector('.loadingBar')
const loadingManger = new THREE.LoadingManager(() => {
    gsap.delayedCall(0.5, () => {
        gsap.to(overlay.material.uniforms.uAlpha, { duration: 3, value: 0 })
        loadingBar.classList.add('ended')
        loadingBar.style.transform = ''
    })
}, (itemUrl, itemsLoaded, itemsTotal) => {
    loadingBar.style.transform = 'scaleX(' + itemsLoaded / itemsTotal + ')'
})
const gltfLoader = new GLTFLoader(loadingManger)
const textureLoader = new THREE.TextureLoader(loadingManger)


/*
    Game Screen
*/
const numberOfBallsScreen = document.querySelector('.cannonBallsNumber');
numberOfBallsScreen.innerHTML  = numberOfBalls

const scoreScreen = document.querySelector('.ScoreNumber')
scoreScreen.innerHTML = score
/*
    Configure Scene
*/
scene.fog = new THREE.Fog(0xcce0ff, 1300, 1600);
const texture = textureLoader.load(
    'textures/skybox/FS002_Day.png',
    () => {
        const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        rt.fromEquirectangularTexture(renderer, texture);
        scene.background = rt.texture;
    });

/*

/*
    Configure Pysics World
*/
const world = new World(GRAVITY, HEIGHT, TEMPERETURE, paramters.windSpeed, paramters.windAngle)

gui.add(paramters, 'windSpeed', 0, 100, 0.01).name("Wind Speed").onChange(() => {
    world.wind_speed = paramters.windSpeed
})
gui.add(paramters, 'windAngle', 0, 6.2831853072, 0.2).name("Wind Angle").onChange(() => {
    world.wind_angle = paramters.windAngle
    rotateAboutPoint(flag, flagBase.position, new THREE.Vector3(0, 1, 0), paramters.windAngle)
})
/*
    Textures
*/
const grassTextures = loadGrassTextures(textureLoader)
const cannonTextures = loadCannonTextures(textureLoader)
const baseTextures = loadBaseTextures(textureLoader)
const targetTextures = loadTargetTextues(textureLoader)
const flagBaseTexutes = loadFlagBaseTextures(textureLoader)
const flagTextures = loadFlagTexture(textureLoader)
/* 
    Models
*/
loadModels(scene, gltfLoader)

/*
    Events
*/
window.addEventListener('dblclick', () => {
    const fullScreen = document.fullscreenElement || document.webkitFullscreenElement
    if (!fullScreen) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen()
        }
        else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen()
        }
    }
    else {
        if (document.exitFullscreen)
            document.exitFullscreen()
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen()
    }
})
window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        createCannonBall()
    }
})

window.addEventListener('resize', () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight
    camera.aspect = size.width / size.height
    camera.updateProjectionMatrix()
    renderer.setSize(size.width, size.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('mousemove', (event) => {
    mouse.x = event.pageX / size.width
    mouse.y = event.pageY / size.height
})
window.addEventListener('touchmove', (event) => {
    mouse.x = event.touches[0].clientX / size.width;
    mouse.y = event.touches[0].clientY / size.height;

})
window.addEventListener("mousedown", () => {
    if (numberOfBalls && window.performance.now() - lastShotingTime > SHOOT_DELAY) {
        createCannonBall()
        lastShotingTime = window.performance.now()
    }
});

const camera = new THREE.PerspectiveCamera(45, size.width / size.height, 0.1, 2000)
camera.position.set(0, 10, 740)
scene.add(camera)

/*
    Lights
*/
const ambientLight = new THREE.AmbientLight('white', 0.75)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight('white', 0.35)
directionalLight.position.copy(new THREE.Vector3(40, 80, -30))
scene.add(directionalLight)

/*
    Objects
*/
const cannon = new THREE.Group()
scene.add(cannon)
const barrel = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(5, 3, 20, 32, 1, true, Math.PI * 2),
    new THREE.MeshStandardMaterial({
        map: cannonTextures.cannonColorTexture,
        aoMap: cannonTextures.cannonAmbientOcclusionTexture,
        roughnessMap: cannonTextures.cannonRoughnessTexture,
        normalMap: cannonTextures.cannonNormalTexture,
        metalnessMap: cannonTextures.cannonMetalnessTexture
    }))
barrel.position.set(0, 10, 660)
barrel.rotation.x = -Math.PI / 4 * 1.5
barrel.material.roughness = 0.5
barrel.material.side = THREE.DoubleSide

cannon.add(barrel)

const cannonCover = new THREE.Mesh(new THREE.SphereBufferGeometry(3, 32, 32,),
    new THREE.MeshStandardMaterial({
        map: cannonTextures.cannonColorTexture,
        aoMap: cannonTextures.cannonAmbientOcclusionTexture,
        roughnessMap: cannonTextures.cannonRoughnessTexture,
        normalMap: cannonTextures.cannonNormalTexture,
        metalnessMap: cannonTextures.cannonMetalnessTexture
    }))

cannonCover.position.y = -10
cannonCover.material.roughness = 0.5
barrel.add(cannonCover)

const floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1500, 1500, 100, 100),
    new THREE.MeshStandardMaterial({
        map: grassTextures.grassColorTexture,
        aoMap: grassTextures.grassAmbientOcclusionTexture,
        displacementMap: grassTextures.grassHeightTexture,
        metalnessMap: grassTextures.grassMetalnessTexture,
        displacementScale: 2,
        normalMap: grassTextures.grassNormalTexture,
        roughnessMap: grassTextures.grassRoughnessTexture,
    }))
floor.material.roughness = 0.5

floor.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2))
floor.rotation.x = -Math.PI / 2
scene.add(floor)

const base = new THREE.Mesh(
    new THREE.BoxBufferGeometry(20, 4, 32, 32),
    new THREE.MeshStandardMaterial({
        map: baseTextures.baseColorTexture,
        aoMap: baseTextures.baseAmbientOcclusionTexture,
        roughnessMap: baseTextures.baseRoughnessTexture,
        metalnessMap: baseTextures.baseMetalnessTexture,
        normalMap: baseTextures.baseNormalTexture
    }))
base.position.copy(barrel.position.clone())
base.position.y += -8.8
scene.add(base)

const flagBase = new THREE.Mesh(new CylinderBufferGeometry(1, 1, 35, 32),
    new THREE.MeshStandardMaterial({
        map: flagBaseTexutes.flagBaseColorTexture,
        aoMap: flagBaseTexutes.flagBaseAmbientOcclusionTexture,
        normalMap: flagBaseTexutes.flagBaseNormalTexture,
        roughnessMap: flagBaseTexutes.flagBaseRoughnessTexture
    })
)
flagBase.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(flagBase.geometry.attributes.uv.array, 2))
flagBase.position.copy(new THREE.Vector3(60, 14, 578.1))
scene.add(flagBase)

const flagGeometry = new PlaneBufferGeometry(13, 13, 32, 32)
const flagMaterial = new THREE.ShaderMaterial({
    vertexShader: flagVertexShader
    , fragmentShader: flagFragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
        uFrequency: { value: new THREE.Vector2(1.04, 2.56) },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('orange') },
        uTexture: { value: flagTextures.flagColorTexture },

    }
})
const flag = new THREE.Mesh(flagGeometry, flagMaterial)
flag.position.copy(flagBase.position.clone().add(new THREE.Vector3(-4, 12, 0)))
flag.position.x = 52.889
flag.position.y = 25.928
flag.scale.y = 2 / 3
scene.add(flag)

let target = new THREE.Mesh(new THREE.CircleGeometry(8, 32), new THREE.MeshStandardMaterial({
    map: targetTextures.targetColorTexture
}))
target.position.set( 0 , 40 , 480)
target.position.y=40
target.position.z=480
target.position.x = 0
scene.add(target)


let linePoints = []
let lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
let backLine
let lineMaterial = new THREE.LineBasicMaterial({ color: 0x2be2e2, linewidth: 100 });
let backLineDraw = function (x, y, z) {
    linePoints.push(new THREE.Vector3(x, y, z))
    lineGeometry.setFromPoints(linePoints);
    backLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(backLine);
}

/*
    Identicator
*/
const points = []
points.push(new THREE.Vector3(- 10, 0, 0));
points.push(new THREE.Vector3(0, 10, 0));
points.push(new THREE.Vector3(10, 0, 0));

const Identicator = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2, 1, 1),
    new THREE.ShaderMaterial({
        vertexShader: `
    void main() {
        gl_Position = modelViewMatrix * vec4(position , 1.0);
    }
    `,
        fragmentShader: `
    void main () {
        gl_FragColor = vec4(1.0, 0.0 , 0.0 , 0.0);
    }
    `
    })
)
scene.add(Identicator)
/*
    Overlay
*/
const overlay = new THREE.Mesh(new PlaneBufferGeometry(2, 2, 1, 1),
    new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uAlpha: { value: 1 }
        },
        vertexShader: `
        void main()
        {
            gl_Position =  vec4(position ,1.0);
        }
        `,
        fragmentShader: `
        uniform float uAlpha;
        void main() 
        {
            gl_FragColor = vec4(0.0 , 0.0 , 0.0 , uAlpha);
        }
        `
    })
)
scene.add(overlay)

/*
    Reycaster
*/
const raycaster = new THREE.Raycaster()


/*
    Renderer
*/
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(size.width, size.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.physicallyCorrectLights = true

/*
ٍShadows
*/
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 1000
directionalLight.shadow.camera.right = 200
directionalLight.shadow.camera.left = -200
directionalLight.shadow.camera.top = 200
directionalLight.shadow.camera.bottom = -200
directionalLight.shadow.mapSize.x = 1024;
directionalLight.shadow.mapSize.y = 1024;

directionalLight.castShadow = true

floor.receiveShadow = true
barrel.castShadow = true
base.receiveShadow = true

const lerp = (a, b, t) => a + (b - a) * t

let angleXY, angleXZ

const updateCannon = () => {
    barrel.rotation.z = -lerp(-Math.PI / 4, Math.PI / 4, mouse.x);
    barrel.rotation.x = -lerp(Math.PI / 8, Math.PI / 2, mouse.y);
    cannonDirection.set(0, 1, 0);
    cannonDirection.applyQuaternion(barrel.quaternion);
    var offset = cannonDirection.clone().multiplyScalar(-40);
    camera.position.copy(barrel.position.clone().add(offset));
    camera.position.y = barrel.position.y + 10;
    camera.lookAt(barrel.position.clone().add(cannonDirection.clone().multiplyScalar(30)));
    var vector = new THREE.Vector3()
    camera.getWorldDirection(vector)
    angleXY = Math.asin(cannonDirection.clone().y)
    angleXZ = Math.acos(cannonDirection.clone().x)
    /*     console.log(" Camera " + Math.asin(cannonDirection.clone().y) + " " + Math.acos(cannonDirection.clone().x) + " ")
     */


}



const clock = new THREE.Clock()
let oldElapsedTime = 0

raycaster.far = 5
raycaster.near = 2
let rayOrigin
let rayDirection = new THREE.Vector3(0, 0, -0.000000001)
rayDirection.normalize()
let currentInstersect = null
let radius = 5

/*
    Utils
*/
let count = 0
const objectsToUpdate = []
const createCannonBall = () => {
   count++
   // radius++

    if(count >3)
    count=1

    console.log("ciubt + " +  count)
    numberOfBalls--
    numberOfBallsScreen.innerHTML = numberOfBalls
    let cannonBall = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshStandardMaterial({
        map: cannonTextures.cannonColorTexture,
        aoMap: cannonTextures.cannonAmbientOcclusionTexture,
        roughnessMap: cannonTextures.cannonRoughnessTexture,
        normalMap: cannonTextures.cannonNormalTexture,
        metalnessMap: cannonTextures.cannonMetalnessTexture
    }));
    cannonBall.castShadow = true
    cannonBall.position.copy(barrel.position.clone().add(new THREE.Vector3(0, 3.5, -1)));
    scene.add(cannonBall);
    let physicsBall = new Ball(barrel.position.clone().add(new THREE.Vector3(0, 3, -1)), 20, angleXY, angleXZ
        , radius, count, 1, DRAG_COEFF, vector.create(50,10,-10), RESISTANSE_COEFF, FRICTION_COEFF)
    world.add(physicsBall)
    objectsToUpdate.push({
        cannonBall,
        physicsBall
    })
}

const updateTarget = (obj) => {
    setTimeout(() => {
        target= new THREE.Mesh(new THREE.CircleGeometry(8, 32), new THREE.MeshStandardMaterial({
            map: targetTextures.targetColorTexture
        }))
        target.position.copy(obj.position.clone().add(new THREE.Vector3((Math.random() - 0.4) *40, (Math.random() - 0.5)*7 , 0)))
        scene.remove(obj)
        scene.add(target)
    } , 1000)
}

let previousAngle = 1.5707963268 * 2;
function rotateAboutPoint(obj, point, axis, theta) {
    obj.rotateOnAxis(axis, -previousAngle);
    obj.position.sub(point);
    obj.position.applyAxisAngle(axis, -previousAngle);
    obj.position.add(point);

    obj.position.sub(point);
    obj.position.applyAxisAngle(axis, theta);
    obj.position.add(point);

    obj.rotateOnAxis(axis, theta);
    previousAngle = theta
}
rotateAboutPoint(flag, flagBase.position, new THREE.Vector3(0, 1, 0), paramters.windAngle)

let shotedTaregt = []

//const control = new OrbitControls(camera, canvas)
const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    flagMaterial.uniforms.uTime.value = elapsedTime * paramters.windSpeed
    const delteTime = elapsedTime - oldElapsedTime
    world.update(delteTime)
    oldElapsedTime = elapsedTime
    for (const object of objectsToUpdate) {
        object.cannonBall.position.copy(object.physicsBall.position)
        rayOrigin = object.cannonBall.position
        raycaster.set(rayOrigin, rayDirection)
        const intersects = raycaster.intersectObject(target)
        for (let intersect of intersects) {
            if (!shotedTaregt.includes(intersect.object)) {
            shotedTaregt.push(intersect.object)
            score++;
            scoreScreen.innerHTML = score
            intersect.object.material.color.set("#ff0000") 
            updateTarget(intersect.object)
        }
        }
      /*   if (intersects.length) {
            currentInstersect = intersects[0]
            score++;
            scoreScreen.innerHTML = score
            currentInstersect.object.material.color.set("#ff0000")
            shotedTaregt.push(intersects[0])
            
        }
        else {
            currentInstersect = null
        } */
    }
    updateCannon()
    /* control.update() */
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
}

tick()
