import React,{useEffect,useRef,useState} from 'react';
import {AppState,BackHandler,Keyboard,Pressable,ScrollView,StyleSheet,Text,TextInput,View,useWindowDimensions} from 'react-native';
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';
import {PresenceEntrance,PresenceMotion} from '../../design/Motion';
import {presence as P} from '../../design/tokens';
import {WelcomeRoot,WelcomeButton} from '../../WelcomeUI';
import {AnimatedSubmitButton,AuthTransitionOverlay,Brand,CurvedAuthShell} from './AnimatedAuth';
type Scenario='Success'|'Instant success'|'Slow success'|'Incorrect password'|'Network failure';
const scenarios:Scenario[]=['Success','Instant success','Slow success','Incorrect password','Network failure'];
export default function AuthAnimationSample(){return <SafeAreaProvider><PresenceMotion><WelcomeRoot><Sample/></WelcomeRoot></PresenceMotion></SafeAreaProvider>}
function Sample(){
 const {height,fontScale}=useWindowDimensions();const insets=useSafeAreaInsets();const [keyboard,setKeyboard]=useState(false);
 const headerHeight=Math.max(insets.top+130,Math.min(keyboard||height<650||fontScale>1.25?180:240,height*.28));
 const [email,setEmail]=useState('preview@example.com'),[password,setPassword]=useState('sample-only'),[visible,setVisible]=useState(false);
 const [scenario,setScenario]=useState<Scenario>('Success'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[destination,setDestination]=useState(false),[overlay,setOverlay]=useState(false),[cycle,setCycle]=useState(0);
 const generation=useRef(0),locked=useRef(false),pending=useRef<ReturnType<typeof setTimeout>|null>(null);const emailRef=useRef<TextInput>(null),passwordRef=useRef<TextInput>(null);
 const reset=()=>{generation.current++;locked.current=false;if(pending.current)clearTimeout(pending.current);setBusy(false);setOverlay(false);setDestination(false);setError('');setCycle(x=>x+1);};
 useEffect(()=>{const show=Keyboard.addListener('keyboardDidShow',()=>setKeyboard(true));const hide=Keyboard.addListener('keyboardDidHide',()=>setKeyboard(false));const back=BackHandler.addEventListener('hardwareBackPress',()=>{reset();return true});const state=AppState.addEventListener('change',s=>{if(s!=='active'&&locked.current){generation.current++;locked.current=false;if(pending.current)clearTimeout(pending.current);setBusy(false);setError('Sample request cancelled while backgrounded. Try again.');}});return()=>{generation.current++;if(pending.current)clearTimeout(pending.current);show.remove();hide.remove();back.remove();state.remove();}},[]);
 const submit=()=>{
 if(locked.current||overlay)return;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError('Enter a valid email address.');emailRef.current?.focus();return;}
 if(!password){setError('Enter your password.');passwordRef.current?.focus();return;}
 const id=++generation.current;locked.current=true;setBusy(true);setError('');
 const settle=()=>{if(id!==generation.current)return;locked.current=false;setBusy(false);if(scenario==='Incorrect password'||scenario==='Network failure'){setError(scenario==='Network failure'?'Sample network request failed. Your entries were kept; try again.':'Sample credentials were rejected. Try again.');return;}Keyboard.dismiss();setKeyboard(false);setOverlay(true);};
 // Explicit development fixture: no credentials leave the device and no session is created.
 if(scenario==='Instant success')settle();else pending.current=setTimeout(settle,scenario==='Slow success'?4500:1200);
 };
 return <View style={{flex:1,backgroundColor:P.color.bg}}>
 {destination?<ScrollView contentContainerStyle={{paddingTop:insets.top+32,paddingHorizontal:24,paddingBottom:insets.bottom+24,gap:24}}>
 <PresenceEntrance order={0}><Text style={s.eyebrow}>ANIMATION SAMPLE</Text><Text accessibilityRole="header" style={s.title}>You’re through.</Text></PresenceEntrance>
 <PresenceEntrance order={1}><View style={s.card}><Text style={s.heading}>Destination preview</Text><Text style={s.body}>The header sweep is complete. This is an isolated visual sample, not an authenticated account.</Text></View></PresenceEntrance>
 <PresenceEntrance order={2}><WelcomeButton onPress={reset} accessibilityLabel="Replay sample" style={s.primary}><Text style={s.white}>Replay sample</Text></WelcomeButton></PresenceEntrance>
 </ScrollView>:<CurvedAuthShell key={cycle} headerHeight={headerHeight}>
 <PresenceEntrance order={1}><Text accessibilityRole="header" style={s.title}>Welcome back</Text><Text style={s.body}>Sign in to manage your business presence.</Text></PresenceEntrance>
 <PresenceEntrance order={2}><View style={{gap:16}}><Text style={s.body}>Sample only · no real sign-in</Text><Text style={s.label}>Email address *</Text><TextInput ref={emailRef} accessibilityLabel="Email address" value={email} onChangeText={setEmail} editable={!busy&&!overlay} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={s.input} returnKeyType="next" onSubmitEditing={()=>passwordRef.current?.focus()}/><Text style={s.label}>Password *</Text><View style={s.password}><TextInput ref={passwordRef} accessibilityLabel="Password" value={password} onChangeText={setPassword} editable={!busy&&!overlay} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} style={[s.input,{flex:1,borderWidth:0}]} onSubmitEditing={submit}/><Pressable accessibilityRole="button" accessibilityLabel={visible?'Hide password':'Show password'} onPress={()=>setVisible(v=>!v)} style={s.textAction}><Text style={s.link}>{visible?'Hide':'Show'}</Text></Pressable></View><Text style={s.body}>Password recovery is not available in the current app.</Text></View></PresenceEntrance>
 <PresenceEntrance order={3}><View style={{gap:16}}>{!!error&&<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{color:P.color.error}}>{error}</Text>}<AnimatedSubmitButton busy={busy||overlay} onPress={submit}/><WelcomeButton disabled accessibilityLabel="Continue with Google, coming soon" style={s.secondary}><Text style={s.label}>Continue with Google · Coming soon</Text></WelcomeButton><Text style={s.body}>Registration stays in the main app.</Text></View></PresenceEntrance>
 <View style={s.card}><Text style={s.eyebrow}>PREVIEW CONTROLS</Text><Text style={s.body}>Choose a simulated response. Use sample values only.</Text><View style={{gap:6,marginTop:12}}>{scenarios.map(item=><Pressable key={item} disabled={busy||overlay} accessibilityRole="radio" accessibilityState={{checked:scenario===item,disabled:busy||overlay}} onPress={()=>setScenario(item)} style={[s.choice,scenario===item&&{borderColor:P.color.blue,backgroundColor:'#EAF0FF'}]}><Text style={s.label}>{item}</Text></Pressable>)}</View><Pressable accessibilityRole="button" onPress={reset} style={s.textAction}><Text style={s.link}>Cancel / reset sample</Text></Pressable></View>
 </CurvedAuthShell>}
 {overlay&&<AuthTransitionOverlay headerHeight={headerHeight} onCovered={()=>setDestination(true)} onFinished={()=>setOverlay(false)}/>}
 </View>;
}
const s=StyleSheet.create({title:{fontSize:32,lineHeight:39,fontWeight:'700',color:P.color.ink},heading:{fontSize:22,fontWeight:'700',color:P.color.ink},body:{fontSize:15,lineHeight:23,color:P.color.body,marginTop:6},label:{fontSize:15,fontWeight:'600',color:P.color.ink},input:{minHeight:56,borderWidth:1,borderColor:P.color.line,borderRadius:16,padding:16,fontSize:16,color:P.color.ink,backgroundColor:'white'},password:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:P.color.line,borderRadius:16,backgroundColor:'white'},textAction:{minHeight:48,minWidth:48,justifyContent:'center',padding:12},link:{color:P.color.blue,fontWeight:'600'},card:{padding:20,borderRadius:18,backgroundColor:'white',borderWidth:1,borderColor:P.color.line,gap:8},eyebrow:{fontSize:12,fontWeight:'700',letterSpacing:1.3,color:P.color.turquoise},choice:{minHeight:44,borderRadius:12,padding:12,borderWidth:1,borderColor:P.color.line},primary:{minHeight:56,borderRadius:999,backgroundColor:P.color.blue,padding:16},white:{color:'white',fontWeight:'600',fontSize:16},secondary:{minHeight:56,borderRadius:999,padding:16,backgroundColor:'white',borderWidth:1,borderColor:P.color.line}});
