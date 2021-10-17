import "./styles.css";
import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/orbitcontrols";
import loadGrassTextures from "./config/GrassTexture";
import { loadCannonTextures } from "./config/CannonTextures";
import { loadBaseTextures } from "./config/BaseTexures";
import Ball from "./physics/ball";
import { loadModels } from "./config/Models";
import { loadTargetTextues } from "./config/targetTexure";
import { CylinderBufferGeometry, PlaneBufferGeometry } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import gsap from "gsap";
import World from "./physics/world";
import { loadFlagBaseTextures } from "./config/flagBaseTextures";
import flagVertexShader from "./shaders/FlagSheders/vertex.glsl";
import flagFragmentShader from "./shaders/FlagSheders/fragment.glsl";
import { loadFlagTexture } from "./config/FlagTexture";
import { loadBallTextures } from "./config/BallTextures";
import vector from "./physics/vector";

/*
    Variables
*/
const gui = new dat.GUI();
gui.close();
let argument = window.matchMedia("(max-width: 425px)");
let fun = (argument) => {
  if (argument.matches) {
    gui.width = 150;
  } else {
    gui.width = 250;
  }
};
fun(argument);
argument.addListener(fun);
const worldfolder = gui.addFolder("world");
const ballFolder = gui.addFolder("ball");
const coefficientsFolder = ballFolder.addFolder("coefficients");
coefficientsFolder.open();
coefficientsFolder.hide();
worldfolder.open();
ballFolder.open();
let isClicked = false;
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const mouse = new THREE.Vector2();
const cannonDirection = new THREE.Vector3();
const scene = new THREE.Scene();
const GRAVITY = 9.8;
const HEIGHT = 0,
  TEMPERETURE = 15; // celsius
const WIND_SPEED = 10,
  WIND_ANGLE = Math.PI / 2;
const SHOOT_DELAY = 2000;
let lastShotingTime = 0;
let numberOfBalls = 20;
let numberOfTargets = 7;
let score = 0;
let isObjectLoaded;
let intersectObjects = [];
let axesHelper;
let isFinished = false;
/*
    Paramters
*/
const paramters = {
  windSpeed: 10,
  windAngle: Math.PI / 2,
  angular_speedX: 0,
  angular_speedY: 1,
  angular_speedZ: 0,
  axesHelper: false,
  radius: 0.5,
  gravity: 9.8,
  dragCoeff: 0.47,
  height: 0,
  tempereture: 15,
  resistanseCoeff: 0.8,
  frictionCoeff: 0.8,
  mass: 1000,
  speed: 20,
  type: 0,
  types: {
    default() {
      paramters.type = 0;
      paramters.ballTextures = ballTextures[0];
      coefficientsFolder.show();
      massController.domElement.hidden = false;
    },
    wood() {
      paramters.type = 1;
      paramters.ballTextures = ballTextures[1];
      coefficientsFolder.hide();
      massController.domElement.hidden = true;
    },
    steal() {
      paramters.type = 2;
      paramters.ballTextures = ballTextures[0];
      coefficientsFolder.hide();
      massController.domElement.hidden = true;
    },
    rubber() {
      paramters.type = 3;
      paramters.ballTextures = ballTextures[2];
      coefficientsFolder.hide();
      massController.domElement.hidden = true;
    },
  },
};

/*
    Loaders
*/
const loadingBar = document.querySelector(".loadingBar");
const loadingManger = new THREE.LoadingManager(
  () => {
    gsap.delayedCall(0.5, () => {
      gsap.to(overlay.material.uniforms.uAlpha, { duration: 3, value: 0 });
      loadingBar.classList.add("ended");
      loadingBar.style.transform = "";
      document.querySelector(".screenInfo").classList.remove("hide");
    });
    isObjectLoaded = true;
  },
  (itemUrl, itemsLoaded, itemsTotal) => {
    loadingBar.style.transform = "scaleX(" + itemsLoaded / itemsTotal + ")";
  }
);
const gltfLoader = new GLTFLoader(loadingManger);
const textureLoader = new THREE.TextureLoader(loadingManger);
const audioLoader = new THREE.AudioLoader(loadingManger);
audioLoader.load("sounds/cannonShootingSound.mp3", (audioBuffer) => {
  shootingSoundEffect.setBuffer(audioBuffer);
});

/*
    Game Screen
*/
const numberofBallsWidget = document.querySelector(".cannonBallsNumber");
numberofBallsWidget.innerHTML = numberOfBalls;

const scoreWidget = document.querySelector(".ScoreNumber");
scoreWidget.innerHTML = score;

const targetWidget = document.querySelector(".targetNumbers");
targetWidget.innerHTML = numberOfTargets;

const gameFinshed = document.querySelector(".gameFinshedLayout");

const playAgain = document.querySelector(".playAgain");
/*
    Configure Scene
*/
scene.fog = new THREE.Fog(0xcce0ff, 1300, 1600);
const texture = textureLoader.load("textures/skybox/FS002_Day.png", () => {
  const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
  rt.fromEquirectangularTexture(renderer, texture);
  scene.background = rt.texture;
});

/*
    Configure Pysics World
*/
const world = new World(GRAVITY, HEIGHT, TEMPERETURE, WIND_SPEED, WIND_ANGLE);

worldfolder
  .add(paramters, "gravity", -10, 100, 0.1)
  .name("gravity")
  .onChange(() => {
    world.gravity = paramters.gravity;
  });

worldfolder
  .add(paramters, "windSpeed", 0, 100, 0.01)
  .name("Wind Speed")
  .onChange(() => {
    world.wind_speed = paramters.windSpeed;
  });
worldfolder
  .add(paramters, "windAngle", 0, 6.2831853072, 0.2)
  .name("Wind Angle")
  .onChange(() => {
    world.wind_angle = paramters.windAngle;
    rotateAboutPoint(
      flag,
      flagBase.position,
      new THREE.Vector3(0, 1, 0),
      paramters.windAngle
    );
  });
worldfolder
  .add(paramters, "height", -100, 1000, 10)
  .name("Height")
  .onChange(() => {
    world.height = paramters.height;
  });

worldfolder
  .add(paramters, "tempereture", -100, 100, 1)
  .name("Tempereture")
  .onChange(() => {
    world.tempereture = paramters.tempereture;
  });

/* 
    Tweak gui values
*/
ballFolder.add(paramters, "axesHelper");
ballFolder.add(paramters, "radius", 0, 1, 0.01).name("ball radius");
let massController = ballFolder
  .add(paramters, "mass", 1, 5000, 0.5)
  .name("ball mass");
ballFolder.add(paramters, "speed", 10, 35, 0.1).name("ball speed");
ballFolder
  .add(paramters, "angular_speedX", -10, 10, 0.1)
  .name("Angular speed X");
ballFolder
  .add(paramters, "angular_speedY", -10, 10, 0.1)
  .name("Angular speed Y");
ballFolder
  .add(paramters, "angular_speedZ", -10, 10, 0.1)
  .name("Angular speed Z");
const subFolder = ballFolder.addFolder("types");
subFolder.add(paramters.types, "default");
subFolder.add(paramters.types, "wood");
subFolder.add(paramters.types, "steal");
subFolder.add(paramters.types, "rubber");
subFolder.open();

coefficientsFolder.add(paramters, "dragCoeff", 0, 1, 0.001).name("dragCoeff");
coefficientsFolder
  .add(paramters, "resistanseCoeff", 0, 1, 0.001)
  .name("resistanseCoeff");
coefficientsFolder
  .add(paramters, "frictionCoeff", 0, 1, 0.001)
  .name("frictionCoeff");
/*
    Textures
*/
const grassTextures = loadGrassTextures(textureLoader);
const cannonTextures = loadCannonTextures(textureLoader);
const baseTextures = loadBaseTextures(textureLoader);
const targetTextures = loadTargetTextues(textureLoader);
const flagBaseTexutes = loadFlagBaseTextures(textureLoader);
const flagTextures = loadFlagTexture(textureLoader);
const ballTextures = loadBallTextures(textureLoader);
paramters.ballTextures = ballTextures;
paramters.types.default();

/* 
    Models
*/
loadModels(scene, gltfLoader, intersectObjects);

/*
    Events
*/
gui.domElement.addEventListener("mousedown", () => (isClicked = true));
gui.domElement.addEventListener("mouseleave", () => (isClicked = false));
window.addEventListener("mouseup", () => checkGame());
window.addEventListener("dblclick", () => {
  const fullScreen =
    document.fullscreenElement || document.webkitFullscreenElement;
  if (!fullScreen) {
    if (canvas.requestFullscreen) {
      canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) {
      canvas.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
});
window.addEventListener("keydown", (event) => {
  if (!objectsToUpdate.length) {
    return;
  }
  if (event.code === "Digit2") {
    isCameraChasing = true;
  } else if (event.code === "Digit1") {
    isCameraChasing = false;
  }
});

window.addEventListener("resize", () => {
  size.width = window.innerWidth;
  size.height = window.innerHeight;
  camera.aspect = size.width / size.height;
  chasingCamera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  chasingCamera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("mousemove", (event) => {
  mouse.x = event.pageX / size.width;
  mouse.y = event.pageY / size.height;
});
window.addEventListener("touchmove", (event) => {
  event.preventDefault();
  mouse.x = event.touches[0].clientX / size.width;
  mouse.y = event.touches[0].clientY / size.height;
});

window.addEventListener("click", () => {
  if (
    !isClicked &&
    !isFinished &&
    isObjectLoaded &&
    numberOfBalls &&
    numberOfTargets &&
    window.performance.now() - lastShotingTime > SHOOT_DELAY
  ) {
    isClicked = false;
    shootingSoundEffect.play();
    createCannonBall();
    let zPosition = cannon.position.z;
    gsap.to(cannon.position, {
      duration: 1.5,
      delay: 0.2,
      z: cannon.position.z + 15,
    });
    gsap.delayedCall(0.2, () => {
      gsap.to(cannon.position, { duration: 1.5, delay: 0.2, z: zPosition });
    });
    isCameraChasing = true;
    setTimeout(() => (isCameraChasing = false), 8000);
    lastShotingTime = window.performance.now();
  }
});
playAgain.addEventListener("mousedown", () => {
  gameFinshed.classList.add("hide");
  score = 0;
  numberOfBalls = 20;
  numberOfTargets = 7;
  targetWidget.innerHTML = numberOfTargets;
  scoreWidget.innerHTML = score;
  setTimeout(() => (isFinished = false), 1000);
});

/* 
    Cameras
*/
let isCameraChasing = false;
const camera = new THREE.PerspectiveCamera(
  45,
  size.width / size.height,
  0.1,
  1600
);
camera.position.set(0, 10, 740);
scene.add(camera);
const chasingCamera = new THREE.PerspectiveCamera(
  45,
  size.width / size.height,
  0.1,
  1600
);
chasingCamera.position.set(0, 10, 0);
scene.add(chasingCamera);

/*
    Sounds
*/
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
chasingCamera.add(audioListener);
const shootingSoundEffect = new THREE.Audio(audioListener);
scene.add(shootingSoundEffect);

/*
    Lights
*/
const ambientLight = new THREE.AmbientLight("white", 0.75);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight("white", 0.35);
directionalLight.position.copy(new THREE.Vector3(-84.5, 169.1, 696));
scene.add(directionalLight);

/*
    Objects
*/
const cannon = new THREE.Group();
scene.add(cannon);
const metalMaterial = new THREE.MeshStandardMaterial({
  map: cannonTextures.cannonColorTexture,
  aoMap: cannonTextures.cannonAmbientOcclusionTexture,
  roughnessMap: cannonTextures.cannonRoughnessTexture,
  normalMap: cannonTextures.cannonNormalTexture,
  metalnessMap: cannonTextures.cannonMetalnessTexture,
});
const barrel = new THREE.Mesh(
  new THREE.CylinderBufferGeometry(5, 3, 20, 32, 1, true, Math.PI * 2),
  metalMaterial
);
barrel.position.set(0, 10, 660);
barrel.rotation.x = (-Math.PI / 4) * 1.5;
barrel.material.roughness = 0.5;
barrel.material.side = THREE.DoubleSide;
cannon.add(barrel);

const cannonCover = new THREE.Mesh(
  new THREE.SphereBufferGeometry(3, 32, 32),
  metalMaterial
);
cannonCover.position.y = -10;
cannonCover.material.roughness = 0.5;
barrel.add(cannonCover);

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
  })
);
floor.material.roughness = 0.5;
floor.geometry.setAttribute(
  "uv2",
  new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2)
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const base = new THREE.Mesh(
  new THREE.BoxBufferGeometry(20, 4, 32, 32),
  new THREE.MeshStandardMaterial({
    map: baseTextures.baseColorTexture,
    aoMap: baseTextures.baseAmbientOcclusionTexture,
    roughnessMap: baseTextures.baseRoughnessTexture,
    metalnessMap: baseTextures.baseMetalnessTexture,
    normalMap: baseTextures.baseNormalTexture,
  })
);
base.position.copy(barrel.position.clone());
base.position.y += -8.8;
scene.add(base);

const flagBase = new THREE.Mesh(
  new CylinderBufferGeometry(1, 1, 35, 32),
  new THREE.MeshStandardMaterial({
    map: flagBaseTexutes.flagBaseColorTexture,
    aoMap: flagBaseTexutes.flagBaseAmbientOcclusionTexture,
    normalMap: flagBaseTexutes.flagBaseNormalTexture,
    roughnessMap: flagBaseTexutes.flagBaseRoughnessTexture,
  })
);
flagBase.geometry.setAttribute(
  "uv2",
  new THREE.Float32BufferAttribute(flagBase.geometry.attributes.uv.array, 2)
);
flagBase.position.copy(new THREE.Vector3(60, 14, 578.1));
scene.add(flagBase);

const flagGeometry = new PlaneBufferGeometry(13, 13, 32, 32);
const flagMaterial = new THREE.ShaderMaterial({
  vertexShader: flagVertexShader,
  fragmentShader: flagFragmentShader,
  side: THREE.DoubleSide,
  uniforms: {
    uFrequency: { value: new THREE.Vector2(1.04, 2.56) },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color("orange") },
    uTexture: { value: flagTextures.flagColorTexture },
  },
});
const flag = new THREE.Mesh(flagGeometry, flagMaterial);
flag.position.copy(flagBase.position.clone().add(new THREE.Vector3(-4, 12, 0)));
flag.position.x = 52.889;
flag.position.y = 25.928;
flag.scale.y = 2 / 3;
scene.add(flag);

let target = new THREE.Mesh(
  new THREE.CircleGeometry(8, 32),
  new THREE.MeshStandardMaterial({
    map: targetTextures.targetColorTexture,
  })
);
target.position.set(0, 40, 480);
target.position.set(0, 40, 480);
scene.add(target);
intersectObjects.push(target);

/*
    Overlay
*/
const overlay = new THREE.Mesh(
  new PlaneBufferGeometry(2, 2, 1, 1),
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uAlpha: { value: 1 },
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
        `,
  })
);
scene.add(overlay);

/*
    Reycaster
*/
const raycaster = new THREE.Raycaster();
raycaster.far = 20;
raycaster.near = 2;
let rayOrigin;
let rayDirection = new THREE.Vector3(0, 0, -10);
rayDirection.normalize();

/*
    Renderer
*/
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;

/*
    Shadows
*/
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 450;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.top = 200;
directionalLight.shadow.camera.bottom = -200;
directionalLight.shadow.mapSize.x = 1024;
directionalLight.shadow.mapSize.y = 1024;

directionalLight.castShadow = true;
floor.receiveShadow = true;
barrel.castShadow = true;
base.receiveShadow = true;

/*
    Utils
*/
const lerp = (a, b, t) => a + (b - a) * t;

let angleXY, angleXZ;

const updateCannon = () => {
  barrel.rotation.z = -lerp(-Math.PI / 4, Math.PI / 4, mouse.x);
  barrel.rotation.x = -lerp(Math.PI / 8, Math.PI / 2, mouse.y);
  cannonDirection.set(0, 1, 0);
  cannonDirection.applyQuaternion(barrel.quaternion);
  let offset = cannonDirection.clone().multiplyScalar(-40);
  camera.position.copy(barrel.position.clone().add(offset));
  camera.position.y = barrel.position.y + 10;
  camera.lookAt(
    barrel.position.clone().add(cannonDirection.clone().multiplyScalar(30))
  );
  let vector = new THREE.Vector3();
  camera.getWorldDirection(vector);
  angleXY = Math.asin(cannonDirection.clone().y);
  angleXZ = Math.acos(cannonDirection.clone().x);
};

let objectsToUpdate = [];
const createCannonBall = () => {
  removeBallsGreaterThanOne();
  numberOfBalls--;
  numberofBallsWidget.innerHTML = numberOfBalls;
  let cannonBall = new THREE.Mesh(
    new THREE.SphereGeometry(paramters.radius * 5, 32, 32),
    new THREE.MeshStandardMaterial({
      map: paramters.ballTextures.color,
      aoMap: paramters.ballTextures.ao,
      roughnessMap: paramters.ballTextures.roughness,
      normalMap: paramters.ballTextures.normal,
      metalnessMap: paramters.ballTextures.metalness,
    })
  );
  cannonBall.castShadow = true;
  cannonBall.position.copy(
    barrel.position.clone().add(new THREE.Vector3(0, 3.5, -1))
  );
  scene.add(cannonBall);
  if (axesHelper) {
    scene.remove(axesHelper);
  }
  axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  const angular_speed = vector.create(
    paramters.angular_speedX,
    paramters.angular_speedY,
    paramters.angular_speedZ
  );
  let physicsBall = new Ball(
    barrel.position.clone().add(new THREE.Vector3(0, 3, -1)),
    paramters.speed,
    angleXY,
    angleXZ,
    paramters.radius,
    paramters.type,
    paramters.mass,
    paramters.dragCoeff,
    angular_speed,
    paramters.resistanseCoeff,
    paramters.frictionCoeff
  );
  world.add(physicsBall);
  objectsToUpdate.push({
    cannonBall,
    physicsBall,
  });
  intersectObjects.push(cannonBall);
};

const removeBallsGreaterThanOne = () => {
  if (objectsToUpdate.length >= 1) {
    objectsToUpdate.forEach((e) => {
      scene.remove(e.cannonBall);
      e.cannonBall.material.dispose();
      e.cannonBall.geometry.dispose();
      intersectObjects = intersectObjects.filter((i) => i !== e.cannonBall);
    });
    objectsToUpdate = [];
  }
};
const updateTarget = (obj) => {
  setTimeout(() => {
    target = new THREE.Mesh(
      new THREE.CircleGeometry(8, 32),
      new THREE.MeshStandardMaterial({
        map: targetTextures.targetColorTexture,
      })
    );
    target.position.copy(
      new THREE.Vector3(0, 40, 480).add(
        new THREE.Vector3(
          (Math.random() - 0.4) * 40,
          (Math.random() - 0.5) * 7,
          0
        )
      )
    );
    intersectObjects.push(target);
    intersectObjects = intersectObjects.filter((e) => e != obj);
    scene.remove(obj);
    obj.material.dispose();
    obj.geometry.dispose();
    scene.add(target);
  }, 1000);
};

const upadteWidgets = () => {
  score++;
  scoreWidget.innerHTML = score;
  numberOfTargets--;
  targetWidget.innerHTML = numberOfTargets;
  if (numberOfTargets == 0) {
    gameFinshed.classList.remove("hide");
    document.querySelector(".status").innerHTML = "You Won";
    isFinished = true;
  }
};

const checkGame = () => {
  if (numberOfTargets === 0) {
    gameFinshed.classList.remove("hide");
    let status = document.querySelector(".status");
    status.innerHTML = "You Won";
    status.style.color = "#346751";
    isFinished = true;
  } else if (numberOfBalls <= numberOfTargets && numberOfTargets != 1) {
    gameFinshed.classList.remove("hide");
    let status = document.querySelector(".status");
    status.innerHTML = "You Lose";
    status.style.color = "#CE1212";
    isFinished = true;
  }
};

const checkBallPosition = (ball) => {
  if (
    ball.position.z >= -900 &&
    ball.position.z <= 900 &&
    ball.position.x >= -900 &&
    ball.position.x <= 900
  ) {
    return;
  } else {
    setTimeout(() => {
      scene.remove(ball);
      ball.geometry.dispose();
      ball.material.dispose();
      let ballItem = objectsToUpdate.filter((e) => e.cannonBall === ball)[0];
      objectsToUpdate = objectsToUpdate.filter((e) => e.cannonBall !== ball);
      world.remove(ballItem.physicsBall);
      intersectObjects = intersectObjects.filter((obj) => obj !== ball);
      isCameraChasing = false;
    }, 1000);
  }
};

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
  previousAngle = theta;
}
rotateAboutPoint(
  flag,
  flagBase.position,
  new THREE.Vector3(0, 1, 0),
  paramters.windAngle
);

let shotedTaregt = [];
const clock = new THREE.Clock();
let oldElapsedTime = 0;
//const control = new OrbitControls(camera, canvas)

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  flagMaterial.uniforms.uTime.value = elapsedTime * paramters.windSpeed;
  const delteTime = elapsedTime - oldElapsedTime;
  world.update(delteTime);
  oldElapsedTime = elapsedTime;
  for (const object of objectsToUpdate) {
    object.cannonBall.position.copy(object.physicsBall.position);
    object.cannonBall.quaternion.copy(object.physicsBall.quaternion);
    checkBallPosition(object.cannonBall);
    rayOrigin = object.cannonBall.position;
    raycaster.set(rayOrigin, rayDirection);
    axesHelper?.position?.copy(object.cannonBall.position);
    axesHelper?.quaternion?.copy(object.cannonBall.quaternion);
    axesHelper.visible = paramters.axesHelper;
    const intersects = raycaster.intersectObjects(intersectObjects, true);
    for (let intersect of intersects) {
      if (
        !shotedTaregt.includes(intersect.object) &&
        intersect.object.geometry.type === "CircleGeometry"
      ) {
        shotedTaregt.push(intersect.object);
        intersect.object.material.color.set("#ff0000");
        updateTarget(intersect.object);
        upadteWidgets();
        checkGame();
      } else if (intersect.object.geometry.type !== "CircleGeometry") {
        object.physicsBall.fraction(intersect);
      }
    }
  }
  if (isObjectLoaded) {
    updateCannon();
  }
  if (objectsToUpdate.slice(-1)[0]?.cannonBall) {
    chasingCamera.position.copy(
      objectsToUpdate
        .slice(-1)[0]
        ?.cannonBall.position.clone()
        .add(new THREE.Vector3(0, 0, 50))
    );
    chasingCamera.lookAt(objectsToUpdate.slice(-1)[0].cannonBall.position);
  }
  if (isCameraChasing) {
    renderer.render(scene, chasingCamera);
  } else {
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
};

tick();
