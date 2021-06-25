import vector from './vector'
import * as THREE from 'three'

class Ball {

    constructor(position, speed, angleXY, angleXZ, raduis, type, mass, drag_coeff,
        lift_coeff, resistanse_coeff, friction_coeff) {
        let a = vector.create(3, -3, 1)
        let b = vector.create(4, 9, 2)
        console.log(a.cross(b))
        this.position = position;
        this.velocity = vector.create(0, 0, 0)
        this.velocity.inits(speed, angleXY, angleXZ)
        this.type = type
        this.drag_coeff = drag_coeff
        this.lift_coeff = lift_coeff
        this.resistanse_coeff = resistanse_coeff
        this.friction_coeff = friction_coeff
        this.raduis = raduis / 100; //m
        this.rho = 0;
        if (this.type == 1) {
            this.rho = 500; // kg/m^3  wood
        }
        else if (this.type == 2) {
            this.rho = 786; // steel
        }
        else if (this.type == 3) {
            this.rho = 110; // rubber
        }
        if (this.type == 0) { // user value
            this.mass = mass
        }
        else {
            this.mass = this.rho * 3 / 4 * Math.PI * Math.pow(this.raduis, 3); //kg //
        }
        //this.mass=0.035
        this.area = Math.PI * Math.pow(this.raduis, 2);
        console.log(this.area, " ", Math.pow(raduis, 3))
        console.log("mass " + this.mass, " rho " + this.rho + " raduis " + this.raduis)
    }


    //height,tempereture
    update(time, gravity, height, tempereture, wind_speed, wind_angle) {
        //   let acc=vector.create(0,-9.8 * time,0);
        let gravityForce = this.gravity_force(gravity);
        let air_rho = this.calc_air_rho(gravity, height, tempereture)
        let wind_velo = this.calc_wind_velo(wind_speed, wind_angle)
        //   let dragForce = vector.create(0, 0, 0); 
        let dragForce = this.drag_force(air_rho, this.drag_coeff);
        //      let windForce = vector.create(0, 0, 0);
        let windForce = this.wind_force(air_rho, wind_velo);


        // let liftForce = vector.create(0, 0, 0);
        let liftForce = this.lift_force(air_rho, this.lift_coeff, wind_velo);
        //  console.log("liftForce")
        // console.log(liftForce)
        let totalForce = vector.create(dragForce.getX() + windForce.getX() + liftForce.getX(),
            gravityForce.getY() + dragForce.getY() + liftForce.getY(),
            dragForce.getZ() + windForce.getZ() + liftForce.getZ());
        let acc = vector.create(totalForce.getX()  / this.mass, totalForce.getY() / this.mass, totalForce.getZ()  / this.mass)

        this.velocity.addTo(acc ,time);

        this.position.x += (this.velocity.getX() * time)
        this.position.y += (this.velocity.getY() * time)
        this.position.z -= (this.velocity.getZ() * time)
        //another porjectile 
        this.bouncing(this.resistanse_coeff, this.friction_coeff)
        //	this.position.addTo(this.velocity,time);
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


            // if(this.type == 1)
            // this.velocity._y*= -0.603
            // else if(this.type == 2)
            // this.velocity._y*= -0.597
            // if(this.type == 3)
            this.velocity._y *= -res_coeff
            //  console.log(res_coeff)
            /* console.log(this.position.x + " " + this.position.y + " " + this.position.z) */
        }
    }
    gravity_force(gravity) {

        return vector.create(0, - gravity * this.mass, 0)
    }

    drag_force(rho, drag_coeff) {

        let velocitySquere = this.velocity.squere()

        let normalize = this.velocity.normalize()
        let drag = vector.create(
            velocitySquere.getX() * -1 / 2 * drag_coeff * rho * this.area * normalize.getX(),
            velocitySquere.getY() * -1 / 2 * drag_coeff * rho * this.area * normalize.getY(),
            velocitySquere.getZ() * -1 / 2 * drag_coeff * rho * this.area * normalize.getZ()
        )
        return drag
    }

    wind_force(rho, wind_velo) {

        //   let wind_velo = vector.create(Math.round(Math.cos(wind_angle)) * wind_speed, 0, Math.sin(wind_angle) * wind_speed)
        let velocitySquere = wind_velo.squere()
        let normalize = wind_velo.normalize()

        let drag = vector.create(
            velocitySquere.getX() * 1 / 2 * rho * this.area * normalize.getX(),
            0,
            velocitySquere.getZ() * 1 / 2 * rho * this.area * normalize.getZ()
        )
        return drag
    }

    lift_force(rho, lift_coeff, wind_velo) {

        let velo = vector.create(this.velocity.getX() - wind_velo.getX(),
            this.velocity.getY() - wind_velo.getY(),
            this.velocity.getZ() - wind_velo.getZ())
        let velocitySquere = velo.squere()

        let normalize = velo.normalize()

        let zVec = vector.create(0, 1, 0)
        let cross = zVec.cross(normalize)

        let lift = vector.create(
            velocitySquere.getX() * 1 / 2 * lift_coeff * rho * this.area * cross.getX(),
            velocitySquere.getY() * 1 / 2 * lift_coeff * rho * this.area * cross.getY(),
            velocitySquere.getZ() * 1 / 2 * lift_coeff * rho * this.area * cross.getZ()
        )
        // console.log("lift")
        // console.log(lift)
        // console.log(cross)
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

}
export default Ball


/*
air rho=1.225
drag_coeff= 0.47
ball rho=500
raduis = 0.1
mass=rho * pi * raduis^3

angle 45 45
speed 30
99 3 108    without
101 3 107   with


angle 45 90
speed 50
0, 3, -77 without
0, 3, -86 with

angle 45 90
speed 30
0, 3, 87 without
0, 3, 79 with

angle 60 60
speed 30
85 3 105  without
83 3 106  with


angle 60 90
speed 80
0 3 -392  without
0 3 -358  with
*/

