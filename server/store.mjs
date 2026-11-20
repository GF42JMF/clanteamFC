export class StoreError extends Error { constructor(message,status=503){super(message);this.status=status;} }
export class MemoryStore {
  mode='preview'; rows=new Map();
  async list(kind){return [...this.rows.values()].filter(r=>r.kind===kind).map(r=>structuredClone(r));}
  async get(kind,id){return structuredClone(this.rows.get(kind+':'+id)||null);}
  async put(kind,id,data,expected){const key=kind+':'+id,old=this.rows.get(key);if(expected!==undefined&&(old?.revision||0)!==expected)throw new StoreError('Los datos cambiaron en otra sesión. Recargá antes de guardar.',409);const row={kind,id,data:structuredClone(data),revision:(old?.revision||0)+1,updated_at:new Date().toISOString()};this.rows.set(key,row);return structuredClone(row);}
  async remove(kind,id){this.rows.delete(kind+':'+id);}
}
export class SupabaseStore {
  mode='supabase';
  constructor(url,key){this.url=url;this.key=key;}
  async request(query,options={}){if(!this.key)throw new StoreError('Falta configurar el guardado administrativo en el servidor.');const headers={apikey:this.key,'Content-Type':'application/json',...options.headers};if(this.key.startsWith('eyJ'))headers.Authorization='Bearer '+this.key;let r;try{r=await fetch(this.url+'/rest/v1/clan_records?'+query,{...options,headers,signal:AbortSignal.timeout(10000)});}catch{throw new StoreError('No se pudo conectar con la administración del club.');}if(!r.ok){if(r.status===409)throw new StoreError('Ese registro ya existe o cambió. Actualizá los datos.',409);throw new StoreError('El guardado no está disponible. Verificá la migración y las variables del servidor.');}const text=await r.text();return text?JSON.parse(text):[];}
  async list(kind){return this.request('kind=eq.'+encodeURIComponent(kind)+'&select=*&limit=10000');}
  async get(kind,id){return (await this.request('kind=eq.'+encodeURIComponent(kind)+'&id=eq.'+encodeURIComponent(id)+'&limit=1'))[0]||null;}
  async put(kind,id,data,expected){const old=expected===undefined?await this.get(kind,id):null,revision=expected??old?.revision??0;let rows;if(revision===0){rows=await this.request('on_conflict=kind,id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({kind,id,data,revision:1,updated_at:new Date().toISOString()})});}else{rows=await this.request('kind=eq.'+encodeURIComponent(kind)+'&id=eq.'+encodeURIComponent(id)+'&revision=eq.'+revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({data,revision:revision+1,updated_at:new Date().toISOString()})});}if(!rows.length)throw new StoreError('Los datos cambiaron en otra sesión. Recargá antes de guardar.',409);return rows[0];}
  async remove(kind,id){await this.request('kind=eq.'+encodeURIComponent(kind)+'&id=eq.'+encodeURIComponent(id),{method:'DELETE'});}
}
