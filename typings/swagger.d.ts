declare interface Swagger {
    basePath: string
    definitions: {
        [key: string]: {//do name
            type: string,
            properties: {
                [key: string]: {//pro name
                    format: string, type: string
                },
            }[],
        }
    }
    host: string
    info: any
    paths: {
        [key: string]: { //path
            [key: string]: { // http method
                consumes: any[], operationId: string, produces: any[],
                responses: any, summary: string,
                tags: string[]
            }
        }
    }
    tags: string [],
    parameters: any[]
}


declare interface TemplateData {


}