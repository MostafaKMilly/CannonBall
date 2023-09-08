[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Hacktoberfest](https://img.shields.io/github/hacktoberfest/2021/MostafaKMilly/CannonBall?suggestion_label=help%20wanted)

## Cannon ball

It is a game was built for scientific calculations project in Information Technology engineering university [Click here to play](https://mostafakmilly.github.io/CannonBall/dist/).

![intro](https://i.ibb.co/P5P8XY8/Screenshot-2021-09-06-001331.png)

* * *

## Cannonball Movement
We Use a lot of forces which affect the ball during movement and here is the forces we use
* gravityForce
* dragForce
* windForce
* liftForce
* buoynancyForce

To simulate the ball movement we use [Semi implicit Euler](https://en.wikipedia.org/wiki/Semi-implicit_Euler_method) to calculate the ball position and velocity in each frame :
```
velocity += acceleration * dt;
position += velocity * dt;
```
As for calculating ball rotation we use [Quaternion](https://en.wikipedia.org/wiki/Quaternion) to produce rotation matrix which we use to calculate [torque](https://en.wikipedia.org/wiki/Torque).

and we update quaternion vector as following :
```
updateQuaternion(vector, time) {
        const quaternionTemp = new THREE.Quaternion(vector._x * time, vector._y * time, vector._z * time, 0)
        quaternionTemp.multiply(this.quaternion)
        this.quaternion.x += quaternionTemp.x * 0.5
        this.quaternion.y += quaternionTemp.y * 0.5
        this.quaternion.z += quaternionTemp.z * 0.5
        this.quaternion.w += quaternionTemp.w * 0.5
    }
```
## Project stucture
```
CannonBall
│   README.md
└───src
│   │   index.html
│   │   script.js
|   |   style.css
│   │
│   └───config
│       │   BaseTexures.js
|       |   CannonTextures.js
|       |   FlagBaseTextures.js
|       |   FlagTexture.js
|       |   GrassTexture.js
|       |   Models.js
|       |   TargetTexure.js
│   
└───physics
    │   ball.js
    │   vector.js
    |   world.js
```

- `physics` folder represent the logic of the game and we implement the movement and rotation of the ball in it
- `src/script.js` file represent the view of the game and we use Threejs library to create 3d enviroment

## Tech Stack
* HTML
* Javascript
* CSS
* Threejs
* Webpack

## Contribute
If you are beginner take a look in [contibute](./CONTRIBUTING.md)
 ,if you have any feature or you have bugs create issue and PR to resolve it
### Teammates

* [Humam ALbazzal](https://github.com/dolorsy)
* [Sedra Merkhan](https://github.com/sedramerkhan)
* [AbdulRahman Armashi](https://github.com/abod3e4)
* [Abdulaleem Alsayed](https://github.com/aabadaa)
