uniform vec2 uFrequency;
uniform float uTime;
varying vec2 vUv;
varying float vElevation;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position , 1.0);   
    
    float elevation =sin(modelPosition.x * uFrequency.x - uTime) / uFrequency.x;
    elevation += sin(modelPosition.x * uFrequency.y - uTime) /  uFrequency.y;

    modelPosition.z += elevation;
    
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition; 
    vUv = uv;
    vElevation = elevation;
}