import vector from './vector'
import * as THREE from 'three'
import { Matrix3, Matrix4, Vector3 } from 'three'

class Ball {

    constructor(position, speed, angleXY, angleXZ, raduis, type, mass, drag_coeff,
        angular_velocity, resistanse_coeff, friction_coeff) {
        let a = vector.create(3, -3, 1)
        let b = vector.create(4, 9, 2)
        console.log(a.cross(b))
        this.position = position;
        this.velocity = vector.create(0, 0, 0)
        this.velocity.inits(speed, angleXY, angleXZ)
        this.type = type
        this.drag_coeff = drag_coeff
        this.angular_velocity=angular_velocity
        this.resistanse_coeff = resistanse_coeff
        this.friction_coeff = friction_coeff
        this.raduis = raduis / 100; //m  -----------------------------------
        //  this.raduis=0.1
        this.rho = 0;
        if (this.type == 1) {
            this.rho = 500; // kg/m^3  wood
            console.log("type is wood")
        }
        else if (this.type == 2) {
            this.rho = 7860; // steel
            console.log("type is steel")

        }
        else if (this.type == 3) {
            this.rho = 1100; // rubber
            console.log("type is rubber")

        }
        if (this.type == 0) { // user value
            this.mass = mass
        }
        else {
            this.mass = this.rho * 3 / 4 * Math.PI * Math.pow(this.raduis, 3); //kg //
        }
        //this.mass=0.035
        this.area = Math.PI * Math.pow(this.raduis, 2);
        console.log(this.area, " ", Math.pow(this.raduis, 3))
        console.log("mass " + this.mass, " rho " + this.rho + " raduis " + this.raduis)


        //rotation
        this.rotateAngle=0
        this.rotateAxes=vector.create(0,1,0)
         this.angular_velocity = angular_velocity
         this.angular_acc=new Vector3()
    }


    //height,tempereture
    update(time, gravity, height, tempereture, wind_speed, wind_angle) {
        //   let acc=vector.create(0,-9.8 * time,0);
        let gravityForce = this.gravity_force(gravity);
        let air_rho = this.calc_air_rho(gravity, height, tempereture)
        let wind_velo = this.calc_wind_velo(wind_speed, wind_angle)
        //   let dragForce = vector.create(0, 0, 0); 
        let dragForce = this.drag_force(air_rho);
        //   let windForce = vector.create(0, 0, 0);
        let windForce = this.wind_force(air_rho, wind_velo);


        // let liftForce = vector.create(0, 0, 0);
        let liftForce = this.lift_force(air_rho, wind_velo);
        //  console.log("liftForce")
        // console.log(liftForce)
        let totalForce = vector.create(dragForce.getX() + windForce.getX() + liftForce.getX(),
            gravityForce.getY() + dragForce.getY() + liftForce.getY(),
            dragForce.getZ() + windForce.getZ() + liftForce.getZ());
        let acc = vector.create(totalForce.getX() / this.mass, totalForce.getY() / this.mass, totalForce.getZ() / this.mass)

        this.velocity.addTo(acc, time);

        this.position.x += (this.velocity.getX() * time * 10)
        this.position.y += (this.velocity.getY() * time * 10)
        this.position.z -= (this.velocity.getZ() * time * 10)
        //another porjectile 
        this.bouncing(this.resistanse_coeff, this.friction_coeff)
        //	this.position.addTo(this.velocity,time);
        this.calc_angular_acc(gravity,air_rho,wind_velo)
        //  this.angular_velocity.setX(this.angular_velocity.getX()*this.angular_acc.x* time)
        //  this.angular_velocity.setY(this.angular_velocity.getY()*this.angular_acc.y* time)
        //  this.angular_velocity.setZ(this.angular_velocity.getZ()*this.angular_acc.z* time)
    }

  
    gravity_force(gravity) {

        return vector.create(0, - gravity * this.mass, 0)
    }

    drag_force(rho) {

        let velocitySquere = this.velocity.squere()

        let normalize = this.velocity.normalize()
        let drag = vector.create(
            velocitySquere.getX() * -1 / 2 * this.drag_coeff * rho * this.area * normalize.getX(),
            velocitySquere.getY() * -1 / 2 * this.drag_coeff * rho * this.area * normalize.getY(),
            velocitySquere.getZ() * -1 / 2 * this.drag_coeff * rho * this.area * normalize.getZ()
        )
        return drag
    }

    wind_force(rho, wind_velo) {

        //   let wind_velo = vector.create(Math.round(Math.cos(wind_angle)) * wind_speed, 0, Math.sin(wind_angle) * wind_speed)
        let velocitySquere = wind_velo.squere()
        let normalize = wind_velo.normalize()

        let wind = vector.create(
            velocitySquere.getX() * 1 / 2 * rho * this.area * normalize.getX(),
            0,
            velocitySquere.getZ() * 1 / 2 * rho * this.area * normalize.getZ()
        )
        return wind
    }

    lift_force(rho, wind_velo) {
        // let lift_coeff = 0.5
        let lift_coeff = this.raduis * this.angular_velocity.getLength() / this.velocity.getLength() // cl=r*ω/v
        // let velo = vector.create(this.velocity.getX() - wind_velo.getX(),
        //     this.velocity.getY() - wind_velo.getY(),
        //     this.velocity.getZ() - wind_velo.getZ())
        // let velocitySquere = velo.squere()
        //  let velo_normalize = velo.normalize()

        // let angu_normalize = this.angular_velocity.normalize()

        let velocitySquere = this.velocity.getLength() * this.velocity.getLength()
        let rotate = vector.create(1, 0, 0)
        let cross = rotate.cross(this.velocity)
        // let cross =rotate.cross(velo_normalize)
        // console.log(cross)

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
        //  console.log("rho "+rho+" T "+Tkelvin+" H "+H+" P "+P)
        return rho;
    }

    calc_wind_velo(wind_speed, wind_angle) {
        return vector.create(Number(Math.cos(wind_angle).toFixed(2)) * wind_speed, 0, Math.sin(wind_angle) * wind_speed)

    }

    rotate(time){
        let matrix =new Matrix4()
        let axes =   new Vector3(this.rotateAxes.getX(),this.rotateAxes.getY(),this.rotateAxes.getZ())
       
        console.log(this.angular_velocity)
        this.rotateAngle += this.angular_velocity.getLength() // it should be multiplied by time but it is not working
        
        matrix.makeRotationAxis(axes , this.rotateAngle)
      // console.log(matrix.elements)
       return matrix

    }
    bouncing(resistanse_coeff, friction_coeff) {
        let res_coeff = 0
        let fric_coeff = 0

        if (this.type == 0) { //user values
            res_coeff = resistanse_coeff
            fric_coeff = friction_coeff
        }
        else if (this.type == 1) { //wood
            res_coeff = 0.4
            fric_coeff = 0.603
        }
        else if (this.type == 2) { //steel
            res_coeff = 0.597
            fric_coeff = 0.7
        }
        else if (this.type == 3) { //rubber
            res_coeff = 0.828
            fric_coeff = 0.35
        }
        if (this.position.y < 3.0) {
            this.position.y = 3.0
            this.velocity._y *= -res_coeff

        }
    }
   
    calc_angular_acc(gravity,air_rho,wind_velo){
        let I = 2/5 * this.mass * Math.pow(this.raduis,2)
        let interia_ball = new Matrix3()
        interia_ball.set(I,0,0,
                         0,I,0,
                         0,0,I)

        let rotateMatrix=new Matrix3() 
        rotateMatrix.setFromMatrix4(this.rotate())
        let inverseRotate=new Matrix3()
        inverseRotate.setFromMatrix4(this.rotate()).invert()
        let temp=rotateMatrix.multiply(interia_ball)
        let interia= temp.multiply(inverseRotate)

         let friction_torque = this.mass* gravity* this.friction_coeff *this.raduis
         let wind_torque = this.wind_force(air_rho,wind_velo).multiply(this.raduis)           
         let torque=new Vector3(friction_torque+wind_torque.getX(),
         friction_torque+wind_torque.getY(),
         friction_torque+wind_torque.getZ())
      //  console.log(torque)
         this.angular_acc=torque.applyMatrix3(interia.invert())
     //    console.log(this.angular_acc)


    }
}
export default Ball

/*


pi/4

283.41759582357275 3 375.58241126991925
505.8709279497639 3 153.12908412995657
679.3685051206678 3 -20.36848948236554

magnus y
389.3470423741184 3 449.05571950198254
844.8473174923424 3 345.4344451788438
1274.5601432252008 3 283.0241834790661
1645.4809690368195 3 241.16214866556183
1952.6159751371206 3 211.4542239593646
*/