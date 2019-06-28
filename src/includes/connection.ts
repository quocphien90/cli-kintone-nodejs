const kintone = require('@kintone/kintone-js-sdk')
const path = require('path');
const rimraf = require('rimraf');
const fs = require('fs')

type ConnectionProps = {
    domain: string;            
    appID: number;
    apiToken?: string;           
    username?: string;            
    password?: string;           
    guestSpaceID?: string;       
    basicAuthUser?: string;      
    basicAuthPassword?: string;  
    proxyHost?: string;      
    proxyPort?: number;  
}

class Connection {
    protected _props: ConnectionProps = {
        ...this._props
    };

    constructor(params: ConnectionProps) {
        if (params) {
          this._props = {...this._props, ...params};
        }
    }

    public getKintoneConnection(): object {
      const auth = new kintone.Auth();
      if(this._props.apiToken){
        auth.setApiToken(this._props.apiToken);
      } else {
        auth.setPasswordAuth(this._props.username, this._props.password);
      }

      if(this._props.basicAuthUser){
        auth.setBasicAuth(this._props.basicAuthUser, this._props.basicAuthPassword);
      }
      const conn = new kintone.Connection(this._props.domain, auth);
      if (this._props.proxyHost && this._props.proxyPort) {
        conn.setProxy(this._props.proxyHost, this._props.proxyPort);
      }
    return conn;
  }


}

export default Connection;