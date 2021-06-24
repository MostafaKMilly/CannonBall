class World {
    constructor(gravity, height, tempereture, wind_speed, wind_angle) {
        this.gravity = gravity
        this.height = height
        this.tempereture = tempereture
        this.wind_speed = wind_speed
        this.wind_angle = wind_angle
        this.objects = []
    }
    add(object) {
        this.objects.push(object)
    }
    update(deltaTime) {
        for (const object of this.objects) {
            object.update(deltaTime, this.gravity, this.height, this.tempereture,this.wind_speed, this.wind_angle)
        }
    }
}
export default World