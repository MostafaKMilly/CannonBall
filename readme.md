Cannon ball is game was built for scientific calculations project in Information technology engineering at Damascus university [Click here to play](https://mostafakmilly.github.io/CannonBall/dist/).

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

### Ball types


| type         | resistanse coeff  | friction coeff |
|:-------------|:------------------|:------|
| wood         |   0.4603    | 0.4       |
| steal        |   0.597   |   0.7    |
| rubber       |   0.828     | 0.7   |

### Resources

1. [physics for game developers](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwiii-To5ujyAhVEhf0HHSWqAxoQFnoECCoQAQ&url=http%3A%2F%2Findex-of.co.uk%2FGame-Development%2FProgramming%2FPhysics%2520for%2520Game%2520Developers.pdf&usg=AOvVaw16SeXwAP-PQp9--L97RPGg)
1. [game physics engine development by ian millington](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwjH0pmM5-jyAhUAhf0HHQ8iCOQQFnoECAMQAQ&url=http%3A%2F%2Fwww.r-5.org%2Ffiles%2Fbooks%2Fcomputers%2Falgo-list%2Frealtime-3d%2FIan_Millington-Game_Physics_Engine_Development-EN.pdf&usg=AOvVaw3IeMO5_gN3raPDcNC5meEn)
1. [gafferongames](https://gafferongames.com/)

### Teammates

* [Humam ALbazzal](https://github.com/dolorsy)
* [Sedra Merkhan](https://github.com/sedramerkhan)
* [AbdulRahman Armashi](https://github.com/abod3e4)
* [Abdulaleem Alsayed](https://github.com/aabadaa)
