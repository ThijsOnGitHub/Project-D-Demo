import * as bodyPix from '@tensorflow-models/body-pix';
import React from 'react';
import './App.css';
import { Keypoint, Pose } from '@tensorflow-models/body-pix/dist/types';
import {  BodyParts } from './react-app-env';

interface Istate{
  loading:boolean
  imageString:string
  file:File|null
  heupMaat:number
  borstMaat:number
}

interface Iprops{

}

class App extends React.Component<Iprops,Istate>{
  private image:React.RefObject<HTMLImageElement>
  private canvas:React.RefObject<HTMLCanvasElement>
  constructor(props:Iprops){
    super(props)
    this.image =React.createRef()
    this.canvas=React.createRef()
    this.state={
      loading:false,
      imageString: "",
      file:null,
      heupMaat:-1,
      borstMaat:-1
    }
  
  }


  handleInputChange=async(event:React.ChangeEvent<HTMLInputElement>)=> {
    const target = event.target;
    const value = target.name === 'isGoing' ? target.checked : target.value;
    const name = target.name;

    if(name=="image"&&target.files!==null){
      var file=target.files[0]
      var fileString=URL.createObjectURL(file)

      this.setState({imageString:fileString})
      
    }

    this.setState<never>({
      [name]: value
    });
  }

  updatePicture=async(target:EventTarget &HTMLInputElement)=>{
    if(target.files!==null){
      var file=target.files[0]
      var fileString=URL.createObjectURL(file)
      
      await this.setState({imageString:fileString})
      console.log("start!")
    }
  } 
  
  logData=async()=>{
    this.setState({loading:true})
    
    var img=this.image.current
   
      console.log("start")
      console.log(img)
  
           const loadAndPredict = async()=> {
            const net = await bodyPix.load({
              architecture: 'ResNet50',
              outputStride: 16
            });
          
            /**
             * One of (see documentation below):
             *   - net.segmentPerson
             *   - net.segmentPersonParts
             *   - net.segmentMultiPerson
             *   - net.segmentMultiPersonParts
             * See documentation below for details on each method.
              */
             
            if(img!==null&&this.canvas.current!==null){
              const segmentation = await net.segmentPersonParts(img);
              var mask=bodyPix.toColoredPartMask(segmentation)
              bodyPix.drawMask(this.canvas.current,img,mask)

              var includeParts=[2,3,4,5,12,13]
              var heupMaat=this.mesurePart(segmentation,(parts)=>{
                var res=Math.round((parts.leftHip.position.y+parts.rightHip.position.y)/2)
                return res
              },includeParts,this.canvas.current)
              var borstMaat=this.mesurePart(segmentation,(parts)=>{
                var res=Math.round((parts.leftShoulder.position.y+parts.rightShoulder.position.y)/2)
                return res
              },includeParts,this.canvas.current)
              this.setState({heupMaat:heupMaat,borstMaat:borstMaat})
              this.drawSkeleton(segmentation,this.canvas.current)
              console.log(segmentation);
            }
           

          }
          await loadAndPredict();
      this.setState({loading:false})
  }

  drawSkeleton=(mask:bodyPix.SemanticPartSegmentation,canvas:HTMLCanvasElement)=>{
    var poses =mask.allPoses.sort((a , b) => b.score - a.score  )
    console.log(poses)
    var pose=poses[0]
      pose.keypoints.forEach(value=>{
        this.drawPoint(canvas,value.position.x,value.position.y,"red")
      })

  }

  drawLine=(canvas:HTMLCanvasElement,yLijn:number)=>{
    var ctx=canvas.getContext("2d")
    if(ctx!==null){
      ctx.fillStyle="black"
    }
    ctx?.fillRect(0,yLijn-0.5,canvas.width,1)
  }

  drawPoint(canvas:HTMLCanvasElement,x:number,y:number,kleur:string){
    var ctx=canvas.getContext("2d")
    if(ctx!==null){
      ctx.fillStyle = kleur
      ctx?.fillRect(x-2.5,y-2.5,5,5)
    }else{
      console.log("canvas null")
    }
  }

  lengte=(mask:bodyPix.SemanticPartSegmentation,yLijn:number,mesurePart:number[],canvas?:HTMLCanvasElement)=>{
    var beginPixel=mask.width*yLijn
    var eindPixel=beginPixel+mask.width
    var outlinePixelNumber:number[]=[]

    console.log(beginPixel)

    for(var i=beginPixel;i<eindPixel;i++){
      var checkPixel=mask.data[i] 
      var nextPixel=mask.data[i+1]
      console.log(i,checkPixel,nextPixel)
      if((mesurePart.includes(checkPixel)&&!mesurePart.includes(nextPixel))||(mesurePart.includes(nextPixel)&&!mesurePart.includes(checkPixel))){
        outlinePixelNumber.push(i)
      }
    }
    outlinePixelNumber.sort((a,b)=>b-a)
    console.log(outlinePixelNumber)
    if(canvas!=undefined){
      console.log("color green!")
      outlinePixelNumber.forEach(value=>{
        this.drawPoint(canvas,value%mask.width,yLijn,"darkblue")
      })
    }
    return outlinePixelNumber[0]-outlinePixelNumber[outlinePixelNumber.length-1]
  }

  mesurePart=(mask:bodyPix.SemanticPartSegmentation,yLijnFunc:(parts:BodyParts)=>number,dectNum:number[],canvas?:HTMLCanvasElement)=>{
    var poses =mask.allPoses.sort((a , b) => b.score - a.score  )
    console.log(poses)
    var pose=poses[0]
    //@ts-ignore
    var poseData:BodyParts={}
    
    pose.keypoints.forEach((value:Keypoint) =>{
      //@ts-ignore
        poseData[value.part]=value
    })

    console.log(poseData)
    var yLijn=yLijnFunc(poseData)
    if(canvas!=undefined){
      this.drawLine(canvas,yLijn)
    }
    
    console.log(yLijn)
    var lengte=this.lengte(mask,yLijn,dectNum,canvas)
    console.log(lengte)
    return lengte
  }

  render(){
    return (
      <div className="App">
        {
          this.state.heupMaat===-1 ||
          <p>Heupmaat: {this.state.heupMaat} pixels</p>
        }
          {
          this.state.borstMaat===-1 ||
          <p>borst: {this.state.borstMaat} pixels</p>
        }
        <input type="file" onChange={this.handleInputChange} name="image" />
        <img  ref={this.image} src={this.state.imageString}/>
        <canvas ref={this.canvas}></canvas>
        {
          this.state.loading?
          <div></div>:
          <button onClick={this.logData}>Start analyse!</button>
        }

        

      </div>
    )
  }
}

export default App;
