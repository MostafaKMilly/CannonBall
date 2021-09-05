Cannon ball is game was built for scientific calculations project in Information technology engineering at Damascus university [Click here to play](https://mostafakmilly.github.io/CannonBall/dist/).

![intro](https://i.ibb.co/P5P8XY8/Screenshot-2021-09-06-001331.png)

* * *

## Cannonball in depth
We Use alot of forces wich effect the ball during movment and here is the forces we use

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

### Ball types


| type         | resistanse coeff  | friction coeff |
|:-------------|:------------------|:------|
| wood         |   0.4603    | 0.4       |
| steal        |   0.597   |   0.7    |
| rubber       |   0.828     | 0.7   |
