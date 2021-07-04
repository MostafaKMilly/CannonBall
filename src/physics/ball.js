import vector from './vector'
import * as THREE from 'three'
import { Vector3 } from 'three'

class Ball {
    constructor(position, speed, angleXY, angleXZ, raduis, type, mass, drag_coeff,
        angular_velocity, resistanse_coeff, friction_coeff) {
        this.position = position;
        this.velocity = vector.create(0, 0, 0)
        this.velocity.inits(speed, angleXY, angleXZ)
        this.type = type
        this.drag_coeff = drag_coeff
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
            this.friction_coeff = 0.35
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

        //Linear Movement
        let acc = vector.create(totalForce.getX() / this.mass, totalForce.getY() /
            this.mass, totalForce.getZ() / this.mass)

        this.velocity.addTo(acc, time);

        this.position.x += (this.velocity.getX() * time * 10)
        this.position.y += (this.velocity.getY() * time * 10)
        this.position.z -= (this.velocity.getZ() * time * 10)

        let interiaTensor = this.rotationMatrix.clone().multiply(this.IBody).multiply(this.rotationMatrix.clone().transpose())

        let friction_torque = this.position.y <=3 ? this.frictionTorque(gravity) : 0

        let viscousTorque = this.viscousTorque()

        //Total Torques
        let torque = new Vector3(friction_torque - viscousTorque.getX(),
            friction_torque - viscousTorque.getY(),
            friction_torque - viscousTorque.getZ())
        
        //Angular Movement
        this.angular_acc = torque.applyMatrix3(interiaTensor)

        //Update angular velocity, rotation Matrix, quaternion 
        this.angular_velocity._x += this.angular_acc.x * time
        this.angular_velocity._y += this.angular_acc.y * time
        this.angular_velocity._z += this.angular_acc.z * time
        this.updateQutatnion(this.angular_velocity, time)
        this.updateRotationMatrix(this.quaternion.normalize())
        
        this.bouncing()
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

    bouncing() {
        let ground = 3.0
        if(this.raduis>4.5)
            ground= 21.0
        else if(this.raduis>4)
             ground= 19.0
        else if(this.raduis>3.5)
            ground= 17.0
        else if(this.raduis>3)
            ground= 14.0
        else if(this.raduis>2.5)
             ground= 12.0
        else if(this.raduis>2)
            ground= 9.0
        else if(this.raduis>1.5)
            ground= 7.0
        else if(this.raduis>0.7)
            ground= 5.0
        if (this.position.y < ground ) {
            this.position.y = ground
            this.velocity._y *= -this.resistanse_coeff
        }
    }


    fraction() {
        this.velocity._z = -this.velocity._z * 0.6
        this.velocity._x = -this.velocity._x * 0.6
        this.angular_velocity.x = - this.angular_velocity.x *  0
        this.angular_velocity.y = - this.angular_velocity.y *  0  
        this.angular_velocity.z = - this.angular_velocity.z  * 0
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

