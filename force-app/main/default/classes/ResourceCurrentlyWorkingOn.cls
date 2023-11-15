public class SpotifyController{
    public static void spotifyMethod(){
        String Access_Token;
        String End_Point = Label.SpotifyEndPoint;
        String Client_Id = Label.Client_id;
        String Client_secret = Label.Client_Secret;
        String requestBody = 'grant_type=client_credentials&client_id=' + Client_Id + '&client_secret=' + Client_secret;
        List<wrapperData> listOfwrapperData = new List<wrapperData>();
        HttpRequest tokenRequest = new HttpRequest();
        tokenRequest.setEndpoint(End_Point);
        tokenRequest.setMethod('POST');
        tokenRequest.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        tokenRequest.setHeader('Content-Length', String.valueOf(requestBody.length()));
        tokenRequest.setBody(requestBody);

        HttpResponse tokenResponse = new HttpResponse();
        Http tokenHttp = new Http();
        tokenResponse = tokenHttp.send(tokenRequest);

        Map<String, Object> mapValues = (Map<string, Object>)JSON.deserializeUntyped(tokenResponse.getBody());
        Access_Token = (String) mapValues.get('access_token');
        System.debug(Access_Token);
        String EndPoint = 'https://api.spotify.com/v1/search?q=tamil&type=album';
        HTTPRequest request = new HTTPRequest();
        request.setEndpoint(EndPoint);
        request.setHeader('Authorization', 'Bearer ' + Access_Token);
        request.setMethod('GET');
        HTTPResponse response = new HTTPResponse();
        HTTP http = new HTTP();
        response = http.send(request);

        Map<String, Object> jsonResponse = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
        Map<String, Object> albums = (Map<String, Object>)jsonResponse.get('albums');
        List<Object> items = (List<Object>)albums.get('items');

        List<wrapperData> albumList = new List<wrapperData>();

        if (items != null){
            for (Object item : items){
                Map<String, Object> albumMap = (Map<String, Object>)item;
                String id = (String) albumMap.get('id');
                String name = (String) albumMap.get('name');

                wrapperData album = new wrapperData();
                album.id = id;
                album.name = name;

                albumList.add(album);
            }
        }

        System.debug('Album Data: ' + albumList);
    }

    public class wrapperData{
        public String Id{ get; set; }

        public String Name{ get; set; }

        public String Images{ get; set; }

    }

}