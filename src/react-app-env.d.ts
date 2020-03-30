// <reference types=react-scripts />

import { Keypoint } from  "@tensorflow-models/body-pix/dist/types";

export interface BodyParts{
nose: Keypoint 
leftEye: Keypoint 
rightEye: Keypoint 
leftEar: Keypoint 
rightEar: Keypoint 
leftShoulder: Keypoint 
rightShoulder: Keypoint 
leftElbow: Keypoint 
rightElbow: Keypoint 
leftWrist: Keypoint 
rightWrist: Keypoint 
leftHip: Keypoint 
rightHip: Keypoint 
leftKnee: Keypoint 
rightKnee: Keypoint 
leftAnkle: Keypoint 
rightAnkle: Keypoint
}