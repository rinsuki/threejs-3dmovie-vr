import { CanvasTexture, Color, DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, TextGeometry, VideoTexture, WebGLRenderer } from "https://cdn.jsdelivr.net/npm/three@0.126.1/build/three.module.js"
// import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.126.1/examples/jsm/controls/OrbitControls.js";
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.126.1/examples/jsm/webxr/VRButton.js";

const video = document.querySelector("video")!
const texture = new VideoTexture(video)

function modifyUV(arr: Array<number>, isRight: boolean) {
    /**
     * 今回の BBB の動画の場合、上下分割型で、下が左目、上が右目用の映像
     * なので UV を 左目用は Y=0.5~1 右目用は 0~0.5 にする必要がある
     * いじりたいのは Y 軸だけなので i=1, i+=2 で Y 軸だけ操作するようにしている
     * もともと PlaneGeometry は Y=0~1 なのでそれを半分にして
     * 右目用だったら半分に割った値をそのまま
     * 左目用だったら半分に割った値に0.5を足す
     * ことでテクスチャの参照位置をいい感じにずらしている
     */
    for (let i=1; i<arr.length; i+=2) {
        arr[i] = (arr[i] / 2) + (isRight ? 0 : 0.5)
    }
}

function textImage(str: string) {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    ctx.font = "40px sans-serif"
    ctx.fillStyle = "white"
    const metrics = ctx.measureText(str)
    canvas.width = metrics.width
    canvas.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 8
    ctx.font = "40px sans-serif"
    ctx.fillStyle = "white"
    ctx.fillText(str, 0, canvas.height - metrics.actualBoundingBoxDescent)
    return canvas
}

const scene = new Scene()
scene.background = new Color(0x404040)
const boxLeft = new Mesh(new PlaneGeometry(1, 9/16), new MeshBasicMaterial({map: texture, side: DoubleSide}))
boxLeft.position.z = -1
boxLeft.layers.set(1) // 左目用
const boxRight = new Mesh(new PlaneGeometry(1, 9/16), new MeshBasicMaterial({map: texture, side: DoubleSide}))
boxRight.position.z = -1
boxRight.layers.set(2) // 右目用
// UV をいじって左目用の映像と右目用の映像を出し分ける
modifyUV(boxLeft.geometry.attributes.uv.array as any, false)
modifyUV(boxRight.geometry.attributes.uv.array as any, true)
scene.add(boxLeft, boxRight)

// TODO: なんかこのへん VR 内に出ない

const floor = new Mesh(new PlaneGeometry(10, 10), new MeshBasicMaterial({side: DoubleSide, color: 0x808080}))
floor.position.y = -2
floor.position.z = -5
floor.rotateX(Math.PI/2)
scene.add(floor)

const textCanvas = textImage("Big Buck Bunny, Licensed under CC-BY 3.0.")
const textTexture = new CanvasTexture(textCanvas)
const text = new Mesh(new PlaneGeometry(1, (textCanvas.height / textCanvas.width)), new MeshBasicMaterial({side: DoubleSide, map: textTexture, transparent: true}))
text.position.set(0, ((9/16)/2) + (textCanvas.height / textCanvas.width), -1)
text.scale.set(0.5, 0.5, 1)
text.layers.enableAll()
scene.add(text)

const camera = new PerspectiveCamera()
camera.layers.enable(1)

const renderer = new WebGLRenderer({ antialias: true })
function setSize() {
    renderer.setPixelRatio(devicePixelRatio)
    renderer.setSize(innerWidth, innerHeight)
    camera.aspect = innerWidth/innerHeight
    camera.updateProjectionMatrix()
}
renderer.xr.enabled = true
renderer.xr.setReferenceSpaceType("local")
setSize()
addEventListener("resize", setSize)


// const controls = new OrbitControls(camera, renderer.domElement)
renderer.setAnimationLoop(() => {
    renderer.render(scene, camera)
})
document.body.appendChild(VRButton.createButton(renderer))
document.body.appendChild(renderer.domElement)

document.body.addEventListener("click", () => {
    if (DeviceOrientationEvent != null && DeviceOrientationEvent.requestPermission != null) {
        DeviceOrientationEvent.requestPermission()
    }
    video.play()
})
