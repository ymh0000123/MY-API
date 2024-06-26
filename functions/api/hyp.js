export default async function(context){
    if  (url.searchParams.get('id') != null){
        return new Response("Hello, world!")
    }
    else if (url.searchParams.get('id') == null){
        return new Response("no")
    }
}