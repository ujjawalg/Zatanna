pragma solidity ^0.4.24;

// Deployed at 0xffe91f1c910eb0693eb533c7ed6391c19dd6a174 on Rinkeby

contract Zatanna{
    address public owner;
    uint public lastSong;
    uint public lastUser;
    uint public lastArtist;
 
    struct User{
        uint uID;
        uint[] likedGenres;
        uint[] purchasedSongs;
        mapping (uint => bool) songPurchased;
    }
 
    struct Artist{
        uint aID;
        string name;
        address artistAddress;
        uint[] songsUploaded;
    }
 
    struct Song{
        uint aID;
        uint sID;
        uint cost;
        uint genre;
        uint releaseDate;
        string name;
    }
 
    enum ROLE {UNREGISTERED, ARTIST, USER}                                      // Keep track of type of user
 
    mapping (uint => Artist) idToArtist;
    mapping (address => uint) artistId;
    mapping (address => User) userId;
    mapping (uint => Song) idToSong;
    mapping (string => Song) hashToSong;                                        // To keep track of unique uploads

    modifier onlyUser {
        require(userId[msg.sender].uID != 0, 'Not a user');
        _;
    }

    modifier onlyArtist {
        require(artistId[msg.sender] != 0, 'Not an artist');
        _;
    }

    constructor() public{
        owner = msg.sender;
        lastSong = 0;
        lastUser = 0;
        lastArtist = 0;
    }
 
    // Returns user type
    function getRole() view external returns(ROLE){
        return ((artistId[msg.sender] != 0) ? ROLE.ARTIST:
                (userId[msg.sender].uID != 0) ? ROLE.USER:
                ROLE.UNREGISTERED);
    }
    
    function songIsUnique(string _hash) view external returns(uint){
        return hashToSong[_hash].sID;
    }
     
    function userRegister(uint[] _likedGenres) public{
        require(userId[msg.sender].uID == 0, 'Already registered!');
        
        lastUser += 1;
        
        User memory newUser = User(lastUser,_likedGenres, new uint[](0));
        userId[msg.sender] = newUser;
    }
     
    function artistRegister(string _name) external payable{
        require(msg.value == 0.05 ether);
        require(artistId[msg.sender] == 0, 'Already registered!');
        lastArtist += 1;
        
        Artist memory newArtist = Artist(lastArtist, _name, msg.sender, new uint[](0));
        
        artistId[msg.sender] = lastArtist;
        idToArtist[lastArtist] = newArtist;

        if (userId[msg.sender].uID == 0) { // Every artist is also a user
            userRegister(new uint[](0));
        }
    }
     
     
    // Add Song details and update Artist's details
    function artistUploadSong(uint _cost, string _name, uint _genre, string songHash) onlyArtist external{
        require(hashToSong[songHash].sID == 0, "Can't upload duplicate");       // Has to be a unique song
    
        lastSong += 1;
        
        Artist storage artistInstance = idToArtist[artistId[msg.sender]];
        artistInstance.songsUploaded.push(lastSong);                            // Update Artist instance
    
        // Map SongID to Song
        idToSong[lastSong] = Song(artistInstance.aID, lastSong, _cost, _genre, now, _name);
        hashToSong[songHash] = idToSong[lastSong];                              // Update hashToSong dictionary
    }
     
    // When user buys song
     function userBuySong(uint songID) onlyUser payable external{
        Song storage song = idToSong[songID];
        require(song.sID != 0, 'Song does not exist!');
        require(msg.value == song.cost);                                        // Check if song cost is paid

        User storage user = userId[msg.sender];
        require(!user.songPurchased[songID]);                                   // Can't buy twice
        
        user.purchasedSongs.push(songID);
        user.songPurchased[songID] = true;
    
        idToArtist[song.aID].artistAddress.transfer(msg.value);                 // Transfer money to artist
    }
     
    // Returns user profile
    function userDetail() view external returns(uint, uint[], uint[]){
        return (userId[msg.sender].uID, userId[msg.sender].likedGenres, userId[msg.sender].purchasedSongs);
    }
     
    // When user checks Artist's profile
    function artistDetail(uint _artistID) view external returns(string , uint[] ){
        return (idToArtist[_artistID].name, idToArtist[_artistID].songsUploaded);
    }

    function getSongRdsDetails(address _address) view external returns(uint, uint, uint){
        uint sReleaseDate = idToSong[lastSong].releaseDate;
        return (artistId[_address], lastSong, sReleaseDate);
    }
     
    // Returns song details
    function songDetail(uint songID) view external returns(uint artistID, uint id, string name, uint cost, uint releaseDate, uint genre){
        Song storage song = idToSong[songID];        
        id = song.sID;
        artistID = song.aID;
        name = song.name;
        cost = song.cost;
        releaseDate = song.releaseDate;
        genre = song.genre;
    }
    
    function donate(uint artistID) public payable{
        idToArtist[artistID].artistAddress.transfer(msg.value);                 // Transfer money to artist
    }
}
