import {Match,Player,UserAccount} from '../types';
export class ApiError extends Error { constructor(message:string,public status:number){super(message);} }
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers},credentials:'same-origin'});const d=await r.json();if(!r.ok)throw new ApiError(d.error||'No se pudo completar la operación.',r.status);return d as T;}
type Club={players:Player[];matches:Match[];source:string};let pending:Promise<Club>|null=null;
export function invalidateClub(){pending=null;}
const club=()=>pending??(pending=api<Club>('/api/club').catch(e=>{pending=null;throw e;}));
export const getLocalMatches=():Match[]=>[];
export const fetchPlayers=async()=> (await club()).players;
export const fetchMatches=async()=> (await club()).matches;
export const upsertMatch=async(match:Match)=>{await api('/api/matches/'+encodeURIComponent(match.id),{method:'PUT',body:JSON.stringify(match)});invalidateClub();return true;};
export const deleteMatch=async(id:string)=>{await api('/api/matches/'+encodeURIComponent(id),{method:'DELETE'});invalidateClub();return true;};
export const upsertPlayer=async(player:Player)=>{await api('/api/players/'+encodeURIComponent(player.id),{method:'PUT',body:JSON.stringify(player)});invalidateClub();return true;};
export const deletePlayer=async(id:string)=>{await api('/api/players/'+encodeURIComponent(id),{method:'DELETE'});invalidateClub();return true;};
export const castMvpVote=async(params:{matchId:string;voterUserId:string;votedPlayerId:string})=>{await api('/api/votes',{method:'POST',body:JSON.stringify(params)});invalidateClub();return 'ok' as const;};
export const auth={session:()=>api<{user:UserAccount|null;mode:string;administrationConfigured:boolean;loginConfigured:boolean}>('/api/session'),login:async(loginId:string,password:string)=>(await api<{user:UserAccount}>('/api/login',{method:'POST',body:JSON.stringify({loginId,password})})).user,register:async(username:string,email:string,password:string)=>(await api<{user:UserAccount}>('/api/register',{method:'POST',body:JSON.stringify({username,email,password})})).user,logout:()=>api('/api/logout',{method:'POST',body:'{}'}),users:async()=>(await api<{users:UserAccount[]}>('/api/users')).users};
export type Payment={playerId:string;year:number;month:string;paid:boolean;amount:number;note:string;revision:number;updatedAt?:string};
export type Photo={id:string;url:string;title:string;match:string;source:string;date?:string};
export type Token={id:string;playerId:string|null;x:number;y:number};
export const fetchPayments=async(year:number)=>(await api<{payments:Payment[]}>('/api/dues?year='+year)).payments;
export const savePayment=async(payment:Payment)=>(await api<{payment:Payment}>('/api/dues',{method:'PUT',body:JSON.stringify(payment)})).payment;
export const fetchGallery=async()=>(await api<{photos:Photo[]}>('/api/gallery')).photos;
export const addPhoto=async(data:Record<string,string>)=>(await api<{photo:Photo}>('/api/gallery',{method:'POST',body:JSON.stringify(data)})).photo;
export const removePhoto=(id:string)=>api('/api/gallery/'+encodeURIComponent(id),{method:'DELETE'});
export const fetchTactics=()=>api<{board:{formation:string;tokens:Token[]}|null;revision:number}>('/api/tactics');
export const saveTactics=(formation:string,tokens:Token[],revision:number)=>api<{revision:number}>('/api/tactics',{method:'PUT',body:JSON.stringify({formation,tokens,revision})});
