
export default {
    exportValidator: (params: any): boolean | string => {
        if (!params.appID) {
            return 'App ID is required'
        }
        if (!params.domain) {
            return 'Domain name is required'
        }
        if(!params.username && !params.apiToken) {
            return 'Authentication is required'
        }
        return false
    },

    importValidator: (params: object): boolean | string => {
        return false
    }
}