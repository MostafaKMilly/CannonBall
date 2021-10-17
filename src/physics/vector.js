import { normalize } from "gsap/gsap-core";

var vector = {
  _x: 0,
  _y: 0,
  _z: 0,

  create: function (x, y, z) {
    var obj = Object.create(this);
    obj.setX(x);
    obj.setY(y);
    obj.setZ(z);
    return obj;
  },

  setX: function (value) {
    this._x = value;
  },

  getX: function () {
    return this._x;
  },

  setY: function (value) {
    this._y = value;
  },

  getY: function () {
    return this._y;
  },

  setZ: function (value) {
    this._z = value;
  },

  getZ: function () {
    return this._z;
  },

  setAngleXY: function (angle) {
    var length = this.getLength();
    this._x = Math.cos(angle) * length;
    this._y = Math.sin(angle) * length;
  },

  setAngle: function (angleXY, angleXZ, angelZY) {
    var length = this.getLength();
    this._x = Math.cos(angleXZ) * length; // alpha
    this._y = Math.cos(angleXY) * length; // Beta
    this._z = Math.cos(angelZY) * length; //gamma
  },

  inits: function (length, angleXY, angleXZ) {
    this._x = Math.cos(angleXY) * Number(Math.cos(angleXZ).toFixed(7)) * length;
    this._y = Math.sin(angleXY) * length;
    this._z = Math.cos(angleXY) * Math.sin(angleXZ) * length;
  },

  getAngleXY: function () {
    return Math.atan(this._y / this._x) || 0;
  },

  getAngleXZ: function () {
    return Math.atan2(this._x, this._z) || 0;
  },

  getAngleZY: function () {
    return Math.atan(this._y / this._z) || 0;
  },

  setLength: function (length) {
    var angleXY = Number(this.getAngleXY().toFixed(1));
    var angleXZ = Number(this.getAngleXZ().toFixed(1));
    let l1 = Number(Math.cos(angleXY).toFixed(1));
    let l2 = Number(Math.cos(angleXZ).toFixed(1));

    this._x = l1 * l2 * length;
    this._y = Number(Math.sin(angleXY).toFixed(2)) * length;
    this._z =
      Number(Math.cos(angleXY).toFixed(2)) *
      Number(Math.sin(angleXZ).toFixed(2)) *
      length;
  },

  getLength: function () {
    return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
  },

  add: function (v2) {
    return vector.create(
      this._x + v2.getX(),
      this._y + v2.getY(),
      this._z + v2.getZ()
    );
  },
  sumToXZ: function (v) {
    this._x -= v;
    this._z -= v;
  },

  // subtract: function(v2) {
  // 	return vector.create(this._x - v2.getX(), this._y - v2.getY());
  // },

  multiply: function (val) {
    return vector.create(this._x * val, this._y * val, this._z * val);
  },

  divide: function (vec) {
    return vector.create(
      this._x / vec.getX(),
      this._y / vec.getY(),
      this._z / vec.getZ()
    );
  },

  addTo: function (v2, time) {
    this._y += v2.getY() * time;
    this._z += v2.getZ() * time;
    this._x += v2.getX() * time;
  },

  // subtractFrom: function(v2) {
  // 	this._x -= v2.getX();
  // 	this._y -= v2.getY();
  // },

  multiplyBy: function (val) {
    this._x *= val;
    this._y *= val;
    this._z *= val;
  },

  divideBy: function (val) {
    this._x /= val;
    this._y /= val;
    this._z /= val;
  },

  squere: function () {
    return this.getLength() * this.getLength();
  },

  normalize: function () {
    return vector.create(
      this._x / this.getLength() || 0,
      this._y / this.getLength() || 0,
      this._z / this.getLength() || 0
    );
  },
  getAxesFrom: function (vec) {
    this._x = (vec._x / vec._x) | 0;
    this._y = (vec._y / vec._y) | 0;
    this._z = (vec._z / vec._z) | 0;
  },

  cross: function (vec) {
    return vector.create(
      this._z * vec.getY() - this._y * vec.getZ(),
      this._z * vec.getX() - this._x * vec.getZ(),
      this._y * vec.getX() - this._x * vec.getY()
    );
  },

  clone: function () {
    return vector.create(this._x, this._y, this._z);
  },
};
export default vector;
