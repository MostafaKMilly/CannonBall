import vector from "./vector";
import * as THREE from "three";
import { Vector3 } from "three";

class Ball {
  constructor(
    position,
    speed,
    angleXY,
    angleXZ,
    raduis,
    type,
    mass,
    drag_coeff,
    angular_velocity,
    resistanse_coeff,
    friction_coeff
  ) {
    this.position = position;
    this.velocity = vector.create(0, 0, 0);
    this.velocity.inits(speed, angleXY, angleXZ);
    this.type = type;
    this.drag_coeff = drag_coeff;
    this.rolling = false;
    this.resistanse_coeff = resistanse_coeff;
    this.friction_coeff = friction_coeff;
    this.raduis = raduis; //m
    this.rho = 0;
    if (this.type == 1) {
      this.rho = 500; // kg/m^3  wood
      this.resistanse_coeff = 0.4603;
      this.friction_coeff = 0.4;
    } else if (this.type == 2) {
      this.rho = 7860; // steel
      this.resistanse_coeff = 0.597;
      this.friction_coeff = 0.7;
    } else if (this.type == 3) {
      this.rho = 1100; // rubber
      this.resistanse_coeff = 0.828;
      this.friction_coeff = 0.7;
    }
    if (this.type == 0) {
      // user value
      this.mass = mass;
    } else {
      this.mass = this.rho * (4 / 3) * Math.PI * Math.pow(this.raduis, 3); //kg
    }
    this.area = Math.PI * Math.pow(this.raduis, 2);
    this.rotateAngle = 0;
    this.rotateAxes = vector.create(
      angular_velocity.getX() > 0 ? 1 : 0,
      angular_velocity.getY(),
      angular_velocity.getZ()
    );
    this.angular_velocity = angular_velocity;
    this.angular_acc = new THREE.Vector3();
    const I = (2 / 5) * this.mass * Math.pow(this.raduis, 2);
    this.IBody = new THREE.Matrix3().set(I, 0, 0, 0, I, 0, 0, 0, I).invert();
    this.quaternion = new THREE.Quaternion();
    this.rotationMatrix = new THREE.Matrix3();
    this.intersectsObjects = [];
  }
  update(time, gravity, air_rho, wind_velo) {
    //Forces
    let gravityForce = this.gravity_force(gravity);
    let dragForce = this.drag_force(air_rho);
    let windForce = this.wind_force(air_rho, wind_velo);
    let liftForce = this.lift_force(air_rho);
    let buoynancyForce = this.buoyancy_force(air_rho, gravity);
    let totalForce = vector.create(
      dragForce.getX() + windForce.getX() + liftForce.getX(),
      gravityForce.getY() +
        dragForce.getY() +
        liftForce.getY() +
        buoynancyForce,
      dragForce.getZ() + windForce.getZ() + liftForce.getZ()
    );

    //Linear Movement
    if (this.rolling) gravityForce.setY(0);
    let acc = vector.create(
      totalForce.getX() / this.mass,
      totalForce.getY() / this.mass,
      totalForce.getZ() / this.mass
    );

    this.velocity.addTo(acc, time);

    if (!this.rolling) {
      this.position.x += this.velocity.getX() * time * 10;
      this.position.y += this.velocity.getY() * time * 10;
      this.position.z -= this.velocity.getZ() * time * 10;
    } else {
      this.position.x -=
        Number(this.angular_velocity._z.toFixed(2)) * this.raduis * time * 10;
      this.position.z +=
        Number(this.angular_velocity._x.toFixed(2)) * this.raduis * time * 10;
    }
    let interiaTensor = this.rotationMatrix
      .clone()
      .multiply(this.IBody)
      .multiply(this.rotationMatrix.clone().transpose());

    let viscousTorque = this.viscousTorque();

    //Total Torques
    let rollingTrouqe = vector.create(0, 0, 0);
    let torque = new Vector3();
    if (this.rolling) {
      rollingTrouqe = this.getTotalRollingTrouqe(
        gravity,
        this.wind_force(air_rho, wind_velo),
        time
      );

      torque = new Vector3(rollingTrouqe._x, 0, rollingTrouqe._z);
    } else {
      torque = new Vector3(
        viscousTorque.getX(),
        viscousTorque.getY(),
        viscousTorque.getZ()
      );
    }

    //Angular Movement
    this.angular_acc = torque.applyMatrix3(interiaTensor);

    if (!this.rolling) {
      this.angular_velocity._x += this.angular_acc.x * time;
      this.angular_velocity._y += this.angular_acc.y * time;
      this.angular_velocity._z += this.angular_acc.z * time;
    } else {
      this.angular_velocity._x += this.angular_acc.x * time;
      this.angular_velocity._z += this.angular_acc.z * time;
    }

    //Update angular velocity, quaternion
    this.updateQuaternion(this.angular_velocity, time);
    this.updateRotationMatrix(this.quaternion.normalize());

    //bouncing
    this.bouncing();
  }

  gravity_force(gravity) {
    return vector.create(0, -gravity * this.mass, 0);
  }

  drag_force(rho) {
    let velocitySquere = this.velocity.squere();

    let normalize = this.velocity.normalize();
    let drag = vector.create(
      ((velocitySquere * -1) / 2) *
        this.drag_coeff *
        rho *
        this.area *
        normalize.getX(),
      ((velocitySquere * -1) / 2) *
        this.drag_coeff *
        rho *
        this.area *
        normalize.getY(),
      ((velocitySquere * -1) / 2) *
        this.drag_coeff *
        rho *
        this.area *
        normalize.getZ()
    );
    return drag;
  }

  wind_force(rho, wind_velo) {
    let velocitySquere = wind_velo.squere();
    let normalize = wind_velo.normalize();

    let wind = vector.create(
      ((velocitySquere * 1) / 2) * rho * this.area * normalize.getX(),
      0,
      ((velocitySquere * 1) / 2) * rho * this.area * normalize.getZ()
    );
    return wind;
  }

  lift_force(rho) {
    let lift_coeff =
      -0.05 +
      Math.sqrt(
        0.0025 +
          (0.36 * this.raduis * this.angular_velocity.getLength()) /
            this.velocity.getLength()
      ); // cl=r*ω/v

    let velocitySquere = this.velocity.squere();

    let cross = this.rotateAxes.cross(this.velocity);

    let lift = vector.create(
      ((velocitySquere * 1) / 2) * lift_coeff * rho * this.area * cross.getX(),
      ((-velocitySquere * 1) / 2) * lift_coeff * rho * this.area * cross.getY(),
      ((velocitySquere * 1) / 2) * lift_coeff * rho * this.area * cross.getZ()
    );
    return lift;
  }

  buoyancy_force(air_density, gravity) {
    let v = (4 / 3) * Math.PI * Math.pow(this.raduis, 3);
    let f = v * air_density * gravity;
    return f;
  }

  viscousTorque() {
    let v = vector.create(
      -this.angular_velocity.getX(),
      -this.angular_velocity.getY(),
      -this.angular_velocity.getZ()
    );
    let len =
      this.angular_velocity.getLength() *
      -8 *
      this.raduis *
      this.raduis *
      this.raduis *
      Math.PI *
      0.0000185;
    v.setLength(len);
    return v;
  }

  frictionTorque(gravity) {
    return this.mass * gravity * this.friction_coeff * this.raduis;
  }

  getTotalRollingTrouqe(gravity, windForce, time) {
    let friction = this.frictionTorque(gravity);
    let I = (2 / 5) * this.mass * Math.pow(this.raduis, 2);

    let fX, fZ, c;

    if (Math.abs(this.angular_velocity.z) > Math.abs(this.angular_velocity.x)) {
      c =
        Math.abs(this.angular_velocity._x) /
        Math.abs(this.angular_velocity._z + this.angular_velocity._x);
      fX = friction * c;
      fZ = friction * (1 - c);
    } else {
      c =
        Math.abs(this.angular_velocity._z) /
        Math.abs(this.angular_velocity._z + this.angular_velocity._x);
      fZ = friction * c;
      fX = friction * (1 - c);
    }

    let result = vector.create(
      Number((-windForce._z * this.raduis * 2).toFixed(2)),
      0,
      Number((windForce._x * this.raduis * 2).toFixed(2))
    );

    if (this.angular_velocity._z > 0) {
      result._z -= fZ;
    } else {
      result._z += fZ;
    }

    if (this.angular_velocity._x > 0) {
      result._x -= Math.abs(fX);
    } else {
      result._x += Math.abs(fX);
    }

    result.divideBy(I);

    if (
      Math.abs(this.angular_velocity._x) < 1 &&
      Math.abs(this.angular_velocity._z) < 1
    ) {
      this.angular_velocity._y = 0;
      this.angular_velocity._z = 0;

      this.angular_velocity._x = 0;
    }

    return result;
  }

  updateQuaternion(vector, time) {
    const quaternionTemp = new THREE.Quaternion(
      vector._x * time,
      vector._y * time,
      vector._z * time,
      0
    );
    quaternionTemp.multiply(this.quaternion);
    this.quaternion.x += quaternionTemp.x * 0.5;
    this.quaternion.y += quaternionTemp.y * 0.5;
    this.quaternion.z += quaternionTemp.z * 0.5;
    this.quaternion.w += quaternionTemp.w * 0.5;
  }

  updateRotationMatrix(quaternion) {
    const q = quaternion;
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
    );
  }
  bouncing() {
    let ground = 3.0;
    if (this.raduis > 4.5) ground = 19.0;
    else if (this.raduis > 4) ground = 17.0;
    else if (this.raduis > 3.5) ground = 14.0;
    else if (this.raduis > 3) ground = 13.0;
    else if (this.raduis > 2.5) ground = 12.0;
    else if (this.raduis > 2) ground = 10.0;
    else if (this.raduis > 1.5) ground = 8.0;
    else if (this.raduis > 1) ground = 6.0;
    else if (this.raduis > 0.7) ground = 5.0;

    if (this.position.y < ground) {
      let veloCopy = this.velocity.clone();

      this.position.y = ground;
      this.velocity._y *= -this.resistanse_coeff;
      this.angular_velocity._y *= -this.resistanse_coeff;
      let costum = Math.sqrt(
        veloCopy._x * veloCopy._x + veloCopy._z * veloCopy._z
      );

      //Rolling Condition
      if (0.17 > this.velocity._y / costum) {
        this.velocity._y = 0;
        if (!this.rolling) {
          this.angular_velocity._z = -1 * veloCopy._x;
          this.angular_velocity._x = -1 * veloCopy._z;
        }
        this.rolling = true;
      } else {
        this.rolling = false;
        this.velocity._x =
          0.6 * this.velocity._x - 0.4 * this.angular_velocity._z * this.raduis;
        this.velocity._z =
          0.6 * this.velocity._z - 0.4 * this.angular_velocity._x * this.raduis;

        this.angular_velocity._z =
          -1 *
          (0.4 * this.angular_velocity._z + (0.6 * veloCopy._x) / this.raduis);
        this.angular_velocity._x =
          -1 *
          (0.4 * this.angular_velocity._x + (0.6 * veloCopy._z) / this.raduis);
      }
    }
  }

  fraction(object) {
    let tempArray = this.intersectsObjects.filter(
      (element) => element === object.object
    );
    if (!tempArray.length) {
      this.intersectsObjects.push(object.object);
      let normal = object.face.normal;
      if (
        (normal.x >= normal.z || normal.x <= normal.z) &&
        Math.fround(normal.y) <= 0
      ) {
        this.velocity._z *= this.resistanse_coeff;
        this.angular_velocity._x *= this.resistanse_coeff;
        this.velocity._z =
          -(0.6 * this.velocity._z) -
          0.4 * this.angular_velocity._x * this.raduis;
        this.angular_velocity._x =
          -1 *
          (0.4 * this.angular_velocity._x +
            (0.6 * this.velocity._z) / this.raduis);
      } else {
        this.velocity._x *= this.resistanse_coeff;
        this.angular_velocity._z *= this.resistanse_coeff;
        this.velocity._x =
          -(0.6 * this.velocity._x) -
          0.4 * this.angular_velocity._z * this.raduis;
        this.angular_velocity._z =
          -1 *
          (0.4 * this.angular_velocity._z +
            (0.6 * this.velocity._x) / this.raduis);
      }
    }
  }
}
export default Ball;
