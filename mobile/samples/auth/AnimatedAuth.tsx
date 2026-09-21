import React, {useEffect, useRef, useState, type PropsWithChildren} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Circle} from 'react-native-svg';
import Animated, {cancelAnimation, Easing, ReduceMotion, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming} from 'react-native-reanimated';
import {PresenceEntrance, usePresenceMotion} from '../../design/Motion';
import {presence as P} from '../../design/tokens';
import {WelcomeButton} from '../../WelcomeUI';
export const authMotion = {contract:240, sweep:560, reveal:220, pill:72};
const APath=Animated.createAnimatedComponent(Path);
export function curve(width:number, edge:number, depth:number) {
 'worklet';
 return `M0 0H${width}V${edge-depth}C${width*.68} ${edge+depth*.18} ${width*.28} ${edge+depth*.35} 0 ${edge-depth*.28}Z`;
}
export function Brand(){return <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Svg width={34} height={34} viewBox="0 0 40 40"><Path d="M11 4H29L38 20L29 36H11L2 20Z" fill="none" stroke="white" strokeWidth={2.5}/><Circle cx={20} cy={20} r={10} fill="white"/></Svg><Text style={{color:'white',fontSize:21,fontWeight:'700'}}>Events Circle</Text></View>}
export function CurvedAuthShell({children,headerHeight}:{children:React.ReactNode;headerHeight:number}){
 const {width}=useWindowDimensions(); const insets=useSafeAreaInsets();
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{paddingBottom:insets.bottom+24}}>
 <PresenceEntrance order={0}><View style={{height:headerHeight}}><Svg width={width} height={headerHeight} style={StyleSheet.absoluteFill}><Path d={curve(width,headerHeight-22,64)} fill={P.color.ink}/></Svg><View style={{paddingTop:insets.top+26,paddingHorizontal:24}}><Brand/><Text style={{color:'#DDEFF0',marginTop:12,fontSize:13}}>Presence · Animation sample</Text></View></View></PresenceEntrance>
 <View style={{width:'100%',maxWidth:480,alignSelf:'center',paddingHorizontal:24,gap:20}}>{children}</View>
 </ScrollView></KeyboardAvoidingView>
}
function Dot({index}:{index:number}){
 const {active,reduced}=usePresenceMotion(); const value=useSharedValue(.5);
 useEffect(()=>{value.set(.5);if(active&&!reduced)value.set(withDelay(index*110,withRepeat(withTiming(1,{duration:450}),-1,true)));return()=>cancelAnimation(value)},[active,reduced,index,value]);
 const style=useAnimatedStyle(()=>({opacity:value.get(),transform:[{translateY:reduced?0:-3*value.get()}]}));
 return <Animated.View style={[{width:7,height:7,borderRadius:4,backgroundColor:'white'},style]}/>;
}
export function AnimatedSubmitButton({busy,onPress}:{busy:boolean;onPress:()=>void}){
 const {reduced,active}=usePresenceMotion();const progress=useSharedValue(0);const [width,setWidth]=useState(300);
 useEffect(()=>{progress.set(withTiming(busy&&!reduced?1:0,{duration:active&&!reduced?authMotion.contract:0}));return()=>cancelAnimation(progress)},[busy,reduced,active,progress]);
 const label=useAnimatedStyle(()=>({opacity:busy&&reduced?0:1-progress.get()}));
 const dots=useAnimatedStyle(()=>({opacity:busy?(reduced?1:progress.get()):0}));
 const surface=useAnimatedStyle(()=>({width:width-(width-authMotion.pill)*progress.get(),left:(width-authMotion.pill)*progress.get()/2}));
 return <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{minHeight:56,justifyContent:'center'}}>
 <Animated.View pointerEvents="none" style={[{position:'absolute',top:0,bottom:0,backgroundColor:P.color.blue,borderRadius:999},surface]}/>
 <WelcomeButton accessibilityLabel={busy?'Signing in, sample request':'Sign in'} accessibilityState={{busy}} disabled={busy} onPress={onPress} style={{minHeight:56,paddingVertical:16,backgroundColor:'transparent',borderRadius:999,alignItems:'center',justifyContent:'center'}}>
 <Animated.Text style={[{color:'white',fontSize:16,fontWeight:'600'},label]}>Sign in</Animated.Text>{busy&&<Animated.View accessible={false} style={[StyleSheet.absoluteFill,{flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center'},dots]}><Dot index={0}/><Dot index={1}/><Dot index={2}/></Animated.View>}
 </WelcomeButton></View>
}
export function AuthTransitionOverlay({headerHeight,onCovered,onFinished}:{headerHeight:number;onCovered:()=>void;onFinished:()=>void}){
 const {width,height}=useWindowDimensions(); const {reduced,active}=usePresenceMotion(); const progress=useSharedValue(0);const opacity=useSharedValue(1);const callbacks=useRef({onCovered,onFinished});callbacks.current={onCovered,onFinished};
 useEffect(()=>{
 let live=true,covered=false,finished=false;
 const cover=()=>{if(live&&!covered){covered=true;callbacks.current.onCovered();}};
 const finish=()=>{if(live&&!finished){cover();finished=true;callbacks.current.onFinished();}};
 if(reduced||!active){finish();return;}
 progress.set(0);opacity.set(1);
 const reveal=()=>{if(!live)return;cover();opacity.set(withTiming(0,{duration:authMotion.reveal},done=>{if(done)runOnJS(finish)()}));};
 progress.set(withTiming(1,{duration:authMotion.sweep,easing:Easing.inOut(Easing.cubic),reduceMotion:ReduceMotion.System},done=>{if(done)runOnJS(reveal)()}));
 // Safety completion only after confirmed fixture success; never decides request outcome.
 const watchdog=setTimeout(finish,1600);
 return()=>{live=false;clearTimeout(watchdog);cancelAnimation(progress);cancelAnimation(opacity);};
 },[active,reduced,width,height,headerHeight,progress,opacity]);
 const props=useAnimatedProps(()=>({d:curve(width,headerHeight-22+progress.get()*(height+180-headerHeight),64)}));
 const fade=useAnimatedStyle(()=>({opacity:opacity.get()}));
 return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={[StyleSheet.absoluteFill,{zIndex:50},fade]}><Svg width={width} height={height}><APath animatedProps={props} fill={P.color.ink}/></Svg></Animated.View>;
}
