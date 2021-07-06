import vector from './vector'
import * as THREE from 'three'
import { Quaternion, Vector3 } from 'three'

class Ball {
    constructor(position, speed, angleXY, angleXZ, raduis, type, mass, drag_coeff,
        angular_velocity, resistanse_coeff, friction_coeff) {
        this.position = position;
        this.velocity = vector.create(0, 0, 0)
        this.velocity.inits(speed, angleXY, angleXZ)
        this.type = type
        this.drag_coeff = drag_coeff
        this.rolling = false
        this.resistanse_coeff = resistanse_coeff
        this.friction_coeff = friction_coeff
        this.raduis = raduis; //m  
        this.rho = 0;
        if (this.type == 1) {
            this.rho = 500; // kg/m^3  wood
            this.resistanse_coeff = 0.4
            this.friction_coeff = 0.603
            console.log("type is wood")
        }
        else if (this.type == 2) {
            this.rho = 7860; // steel
            this.resistanse_coeff = 0.597
            this.friction_coeff = 0.7
            console.log("type is steel")
        }
        else if (this.type == 3) {
            this.rho = 1100; // rubber
            this.resistanse_coeff = 0.828
            this.friction_coeff = 0.7
            console.log("type is rubber")
        }
        if (this.type == 0) { // user value
            this.mass = mass
        }
        else {
            this.mass = this.rho * (4 / 3) * Math.PI * Math.pow(this.raduis, 3); //kg //
        }
        this.area = Math.PI * Math.pow(this.raduis, 2);
        console.log(this.area, " ", Math.pow(this.raduis, 3))
        console.log("mass " + this.mass, " rho " + this.rho + " raduis " + this.raduis)
        this.rotateAngle = 0
        this.rotateAxes = vector.create(angular_velocity.getX() > 0 ? 1 : 0, angular_velocity.getY(), angular_velocity.getZ())
        this.angular_velocity = angular_velocity
        this.angular_acc = new THREE.Vector3()
        const I = 2 / 5 * this.mass * Math.pow(this.raduis, 2)
        this.IBody = new THREE.Matrix3().set(
            I, 0, 0,
            0, I, 0,
            0, 0, I).invert()
        this.quaternion = new THREE.Quaternion()
        this.rotationMatrix = new THREE.Matrix3()
        this.intersectsObjects = []
    }
    update(time, gravity, height, tempereture, wind_speed, wind_angle) {
        //Constants Variables
        let gravityForce = this.gravity_force(gravity);
        let air_rho = this.calc_air_rho(gravity, height, tempereture)
        let wind_velo = this.calc_wind_velo(wind_speed, wind_angle)

        //Forces
        let dragForce = this.drag_force(air_rho);
        let windForce = this.wind_force(air_rho, wind_velo);
        let liftForce = this.lift_force(air_rho);
        let totalForce = vector.create(dragForce.getX() + windForce.getX() + liftForce.getX(),
            gravityForce.getY() + dragForce.getY() + liftForce.getY(),
            dragForce.getZ() + windForce.getZ() + liftForce.getZ());
        this.bouncing(time, gravity, windForce)

        //Linear Movement
        if (this.rolling) {
            gravityForce.setY(0)
        }
        let acc = vector.create(totalForce.getX() / this.mass, totalForce.getY() /
            this.mass, totalForce.getZ() / this.mass)

        this.velocity.addTo(acc, time);

        if (!this.rolling) {
            this.position.x += (this.velocity.getX() * time * 10)
            this.position.y += (this.velocity.getY() * time * 10)
            this.position.z -= (this.velocity.getZ() * time * 10)
        } else {
            this.position.x += this.angular_velocity._z * this.raduis * time * 10
            this.position.z += this.angular_velocity._x * this.raduis * time * 10
        }
        let interiaTensor = this.rotationMatrix.clone().multiply(this.IBody).multiply(this.rotationMatrix.clone().transpose())

        let viscousTorque = this.viscousTorque()

        //Total Torques
        let rollingTrouqe = vector.create(0, 0, 0)
        let torque = vector.create(0, 0, 0)
        if (this.rolling) {
            rollingTrouqe = this.getTotalRollingTrouqe(gravity, this.wind_force(air_rho, wind_velo), time)
            /*             let windTrouqe = this.wind_force(air_rho, wind_velo).multiply(this.raduis)
             */
            torque = new Vector3(rollingTrouqe._x /* + windTrouqe.getX() */, 0, rollingTrouqe._z  /* + windTrouqe.getZ() */)
        } else {
            torque = new Vector3(viscousTorque.getX(),
                viscousTorque.getY(),
                viscousTorque.getZ())
        }
        //Angular Movement
        this.angular_acc = torque.applyMatrix3(interiaTensor)


        // if(this.rolling){
        // if(Math.abs(this.angular_velocity._x)<Math.abs(this.angular_velocity._x + this.angular_acc.x * time))
        // this.angular_velocity._x += Number(this.angular_acc.x.toFixed(4)) * time

        // if(Math.abs(this.angular_velocity._z)<Math.abs(this.angular_velocity._z + this.angular_acc.z * time))
        // this.angular_velocity._z += Number(this.angular_acc.z.toFixed(4)) * time

        // }else{

        // }
        this.angular_velocity._x += this.angular_acc.x * time
        this.angular_velocity._y += this.angular_acc.y * time
        this.angular_velocity._z += this.angular_acc.z * time

        //Update angular velocity, rotation Matrix, quaternion 

        /* console.log("xxx " + this.angular_velocity._x) */

        this.updateQutatnion(this.angular_velocity, time)
        this.updateRotationMatrix(this.quaternion.normalize())

    }

    updateRotationMatrix(quaternion) {
        const q = quaternion
        this.rotationMatrix.set(
            1 - 2 * Math.pow(q.y, 2) - 2 * Math.pow(q.z, 2),
            2 * q.x * q.y - 2 * q.z * q.w,
            2 * q.x * q.z + 2 * q.y * q.w,
            2 * q.x * q.y + 2 * q.z * q.w,
            1 - 2 * Math.pow(q.x, 2) - 2 * Math.pow(q.z, 2),
            2 * q.y * q.z - 2 * q.x * q.w,
            2 * q.x * q.z - 2 * q.y * q.w,
            2 * q.y * q.z + 2 * q.x * q.w,
            1 - 2 * Math.pow(q.x, 2) - 2 * Math.pow(q.y, 2)
        )
    }



    getTotalRollingTrouqe(gravity, windTrouqe, time) {
        let friction = this.frictionTorque(gravity)
        let I = 2 / 5 * this.mass * Math.pow(this.raduis, 2)

        let fX, fZ
        fX = friction
        fZ = friction


        if (Math.abs(this.angular_velocity._x) - Math.abs(friction * time / I) < 0) {
            fX = 0
            this.angular_velocity._x = 0
            /* console.log("no friction at x") */

        }


        if (Math.abs(this.angular_velocity._z) - Math.abs(friction * time / I) < 0) {
            fZ = 0
            this.angular_velocity._z = 0
            /* console.log("no friction at z") */
        }


        let result = vector.create(-windTrouqe._z, 0, windTrouqe._x)

        result._x += fX
        result._z -= fZ
        // let xHelper = this.angular_velocity._x/Math.abs(this.angular_velocity._x) *-1 | 0
        // let zHelper = this.angular_velocity._z/Math.abs(this.angular_velocity._z)*-1  | 0


        let tempAcc = result.clone()
        tempAcc.multiplyBy(this.raduis)
        tempAcc.divideBy(I)





        result.multiply(this.raduis)
        result.divideBy(I)
        return result
    }


    updateQutatnion(vector, time) {
        const quaternionTemp = new THREE.Quaternion(vector._x * time, vector._y * time, vector._z * time, 0)
        quaternionTemp.multiply(this.quaternion)
        this.quaternion.x += quaternionTemp.x * 0.5
        this.quaternion.y += quaternionTemp.y * 0.5
        this.quaternion.z += quaternionTemp.z * 0.5
        this.quaternion.w += quaternionTemp.w * 0.5
    }

    gravity_force(gravity) {
        return vector.create(0, - gravity * this.mass, 0)
    }

    drag_force(rho) {
        let velocitySquere = this.velocity.squere()

        let normalize = this.velocity.normalize()
        let drag = vector.create(
            velocitySquere * -1 / 2 * this.drag_coeff * rho * this.area * normalize.getX(),
            velocitySquere * -1 / 2 * this.drag_coeff * rho * this.area * normalize.getY(),
            velocitySquere * -1 / 2 * this.drag_coeff * rho * this.area * normalize.getZ()
        )
        return drag
    }

    wind_force(rho, wind_velo) {

        let velocitySquere = wind_velo.squere()
        let normalize = wind_velo.normalize()

        let wind = vector.create(
            velocitySquere * 1 / 2 * rho * this.area * normalize.getX(),
            0,
            velocitySquere * 1 / 2 * rho * this.area * normalize.getZ()
        )
        return wind
    }

    lift_force(rho) {
        let lift_coeff = -0.05 + Math.sqrt(0.0025 + 0.36 * this.raduis * this.angular_velocity.getLength() / this.velocity.getLength())  // cl=r*ω/v

        let velocitySquere = this.velocity.squere()

        let cross = this.rotateAxes.cross(this.velocity)

        let lift = vector.create(
            velocitySquere * 1 / 2 * lift_coeff * rho * this.area * cross.getX(),
            - velocitySquere * 1 / 2 * lift_coeff * rho * this.area * cross.getY(),
            velocitySquere * 1 / 2 * lift_coeff * rho * this.area * cross.getZ()
        )
        return lift
    }

    calc_air_rho(g, H, T) {
        let Rspecific = 287.058, R = 8.3148, Md = 0.028964
        let P0 = 1.01325;// 1bar =100000pa  
        let Tkelvin = T + 273.15
        let P = P0 * Math.exp(- Md * g * H / (R * Tkelvin)) * Math.pow(10, 5);
        let rho = P / (Rspecific * Tkelvin);
        return rho;
    }

    calc_wind_velo(wind_speed, wind_angle) {
        return vector.create(Number(Math.cos(wind_angle).toFixed(2)) * wind_speed, 0, Math.sin(wind_angle) * wind_speed)
    }

    bouncing(time, gravity, wind) {
        let ground = 3.0
        if (this.raduis > 4.5)
            ground = 21.0
        else if (this.raduis > 4)
            ground = 19.0
        else if (this.raduis > 3.5)
            ground = 17.0
        else if (this.raduis > 3)
            ground = 14.0
        else if (this.raduis > 2.5)
            ground = 12.0
        else if (this.raduis > 2)
            ground = 9.0
        else if (this.raduis > 1.5)
            ground = 7.0
        else if (this.raduis > 0.7)
            ground = 5.0

        if (this.position.y < ground) {
            let veloCopy = this.velocity.clone()
            let angularCopy = this.angular_velocity.clone()

            let i1 = this.friction_coeff * (1 + this.resistanse_coeff) * veloCopy._y
            let i2 = 0.4 * (veloCopy._x - (angularCopy._z * this.raduis))

            this.position.y = ground
            this.velocity._y *= -this.resistanse_coeff
            this.angular_velocity._y *= -this.resistanse_coeff
            let costum = Math.sqrt(veloCopy._x * veloCopy._x + veloCopy._z * veloCopy._z)

            /*  console.log(this.velocity._y / costum) */

            if (0.17 > this.velocity._y / costum) {

                /* console.log("roll") */
                this.velocity._y = 0
                if (!this.rolling) {
                    /* console.log("not rolling ") */
                    this.angular_velocity._x = -this.velocity._z / this.raduis
                    this.angular_velocity._z = this.velocity._x / this.raduis
                }
                this.rolling = true


                // this.position.x+=this.angular_velocity._z*this.raduis 
                // this.position.z+=this.angular_velocity._x*this.raduis
                // let I = 2 / 5 * this.mass * Math.pow(this.raduis, 2)

                // // this.position._x += (this.friction_coeff * 5 * this.gravity * time) / (2*this.raduis)
                // // this.position._z += (this.friction_coeff * 5 * this.gravity * time) / (2*this.raduis)
                // let xHelper = this.angular_velocity._x/Math.abs(this.angular_velocity._x) *-1 | 0
                // let zHelper = this.angular_velocity._z/Math.abs(this.angular_velocity._z)*-1  | 0

                // let totalForces = vector.create(this.mass  * this.friction_coeff * gravity + wind._x,0,
                //     this.mass  * this.friction_coeff * gravity + wind._z)


                // if(Math.abs(this.angular_velocity._x) > Math.abs(time * (totalForces._x * this.raduis)/I )){
                // // console.log("t1 " + this.angular_velocity._x )
                //     this.angular_velocity._x = this.angular_velocity._x + time * (totalForces._z * this.raduis)/I 
                //     // console.log("t2 " + this.angular_velocity._x )
                //     this.position.z += (this.raduis * this.angular_velocity._x)

                // }else {
                // this.angular_velocity._x = 0}


                // if(Math.abs(this.angular_velocity._z) > Math.abs(time * (totalForces._x * this.raduis)/I)){
                // this.angular_velocity._z = this.angular_velocity._z + time * (totalForces._x * this.raduis)/I 
                // this.position.x += ( this.raduis * this.angular_velocity._z)

                // }
                //     else 
                //     this.angular_velocity._z = 0 


            } else {
                this.rolling = false




                this.velocity._x = (0.6 * this.velocity._x) - (0.4 * this.angular_velocity._z * this.raduis)
                this.velocity._z = (0.6 * this.velocity._z) - (0.4 * this.angular_velocity._x * this.raduis)

                this.angular_velocity._z = -1 * ((0.4 * this.angular_velocity._z) + ((0.6 * veloCopy._x) / this.raduis))
                this.angular_velocity._x = -1 * ((0.4 * this.angular_velocity._x) + ((0.6 * veloCopy._z) / this.raduis))
            }
        }
    }

    fraction(object) {
        let tempArray = this.intersectsObjects.filter((element) => element === object.object)
        if (!tempArray.length) {
            this.intersectsObjects.push(object.object)
            let normal = object.face.normal
            console.log(object.face.normal)
            if ((normal.x >= normal.z || normal.x <= normal.z) && (Math.fround(normal.y) <= 0)) {
                this.velocity._z *= this.resistanse_coeff
                this.angular_velocity._x *= this.resistanse_coeff
                this.velocity._z = -(0.6 * this.velocity._z) - (0.4 * this.angular_velocity._x * this.raduis)
                this.angular_velocity._x = -1 * ((0.4 * this.angular_velocity._x) + ((0.6 * this.velocity._z) / this.raduis))
            }
            else {
                this.velocity._x *= this.resistanse_coeff
                this.angular_velocity._z *= this.resistanse_coeff
                this.velocity._x = -(0.6 * this.velocity._x) - (0.4 * this.angular_velocity._z * this.raduis)
                this.angular_velocity._z = -1 * ((0.4 * this.angular_velocity._z) + ((0.6 * this.velocity._x) / this.raduis))

            }
        }

        // this.velocity._z = -this.velocity._z * 0.6
        // this.velocity._x = -this.velocity._x * 0.6
        // this.angular_velocity.x = - this.angular_velocity.x * 0
        // this.angular_velocity.y = - this.angular_velocity.y * 0
        // this.angular_velocity.z = - this.angular_velocity.z * 0
    }

    viscousTorque() {
        let v = vector.create(-this.angular_velocity.getX(), -this.angular_velocity.getY(), -this.angular_velocity.getZ())
        let len = (this.angular_velocity.getLength() * -8 * this.raduis * this.raduis * this.raduis * Math.PI * 0.0000185)
        v.setLength(len)
        return v
    }

    frictionTorque(gravity) {
        return this.mass * gravity * this.friction_coeff * this.raduis
    }
}
export default Ball

