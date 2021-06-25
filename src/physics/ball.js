import vector from './vector'
import * as THREE from 'three'

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
     //   this.raduis = raduis / 100; //m  -----------------------------------
     this.raduis=0.1
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
    }


    //height,tempereture
    update(time, gravity, height, tempereture, wind_speed, wind_angle) {
        //   let acc=vector.create(0,-9.8 * time,0);
        let gravityForce = this.gravity_force(gravity);
        let air_rho = this.calc_air_rho(gravity, height, tempereture)
        let wind_velo = this.calc_wind_velo(wind_speed, wind_angle)
        //   let dragForce = vector.create(0, 0, 0); 
        let dragForce = this.drag_force(air_rho);
              let windForce = vector.create(0, 0, 0);
        //let windForce = this.wind_force(air_rho, wind_velo);


        let liftForce = vector.create(0, 0, 0);
        //let liftForce = this.lift_force(air_rho, wind_velo);
        //  console.log("liftForce")
        // console.log(liftForce)
        let totalForce = vector.create(dragForce.getX() + windForce.getX() + liftForce.getX(),
            gravityForce.getY() + dragForce.getY() + liftForce.getY(),
            dragForce.getZ() + windForce.getZ() + liftForce.getZ());
        let acc = vector.create(totalForce.getX()  / this.mass, totalForce.getY() / this.mass, totalForce.getZ()  / this.mass)

        this.velocity.addTo(acc ,time);

        this.position.x += (this.velocity.getX() * time*10)
        this.position.y += (this.velocity.getY() * time*10)
        this.position.z -= (this.velocity.getZ() * time*10)
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
            this.velocity._y *= -res_coeff
          
             console.log(this.position.x + " " + this.position.y + " " + this.position.z) 
        }
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

        let wind= vector.create(
            velocitySquere.getX() * 1 / 2 * rho * this.area * normalize.getX(),
            0,
            velocitySquere.getZ() * 1 / 2 * rho * this.area * normalize.getZ()
        )
        return wind
    }

    lift_force(rho, wind_velo) {

        let lift_coeff =this.raduis*this.angular_velocity.getLength()/this.velocity.getLength() // cl=r*ω/v
        let velo = vector.create(this.velocity.getX() - wind_velo.getX(),
            this.velocity.getY() - wind_velo.getY(),
            this.velocity.getZ() - wind_velo.getZ())
        let velocitySquere = velo.squere()

        let velo_normalize = velo.normalize()
       // let angu_normalize = this.angular_velocity.normalize()
        let yVec = vector.create(1, 0, 0)
        let cross =yVec.cross(velo_normalize)
       // console.log(cross)
        let lift = vector.create(
            velocitySquere.getX() * 1 / 2 * lift_coeff * rho * this.area * cross.getX(),
           - velocitySquere.getY() * 1 / 2 * lift_coeff * rho * this.area * cross.getY(),
            velocitySquere.getZ() * 1 / 2 * lift_coeff * rho * this.area * cross.getZ()
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

}
export default Ball

/*
173.40209818169873 3 365.2564571124903
104 310.200367237661 3 142.15915905132115
104 418.09243513798 3 -28.74107401704832
104 504.57289595244055 3 -162.6537326585623
104 574.8207092476705 3 -269.49566413952533

 magnus x
172.78713321080278 3 366.24870676532396          
104 308.7781685940934 3 144.42187049477988
104 416.36969286818197 3 -26.037751146195255
104 502.4207417280695 3 -159.31385320034732


magnus y
173.35885355131146 3 364.9951048837173
104 309.9325427656382 3 141.4840618386071
104 417.52309728037625 3 -29.942292911548957

pi/4
282.2878314447725 3 376.71217562207124
104 501.9871285117073 3 157.01288348403202
104 672.1012414866461 3 -13.101225994717247


magnus y
282.6271593813461 3 376.323219615463
104 504.27826843595915 3 154.4573707569714


283.1725467908016 3 375.82746029689474
ball.js:104 504.6297753440438 3 154.3702367089417
ball.js:104 677.0156576353753 3 -18.015642044334463
*/