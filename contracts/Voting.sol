// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public owner;

    struct Candidate {
        uint id;
        string name;
        string party;
        uint voteCount;
    }

    mapping (uint => Candidate) public candidates;
    mapping (address => bool) public voters;

    uint public countCandidates;
    uint256 public votingEnd;
    uint256 public votingStart;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function addCandidate(string memory name, string memory party) public onlyOwner returns(uint) {
               countCandidates ++;
               candidates[countCandidates] = Candidate(countCandidates, name, party, 0);
               return countCandidates;
    }
   
    function vote(uint candidateID) public {

       require((votingStart <= block.timestamp) && (votingEnd > block.timestamp));
   
       require(candidateID > 0 && candidateID <= countCandidates);

       require(!voters[msg.sender]);
              
       voters[msg.sender] = true;
       
       candidates[candidateID].voteCount ++;
    }
    
    function checkVote() public view returns(bool){
        return voters[msg.sender];
    }
       
    function getCountCandidates() public view returns(uint) {
        return countCandidates;
    }

    function getCandidate(uint candidateID) public view returns (uint,string memory, string memory,uint) {
        return (candidateID,candidates[candidateID].name,candidates[candidateID].party,candidates[candidateID].voteCount);
    }

    function setDates(uint256 _startDate, uint256 _endDate) public onlyOwner {
        require((votingEnd == 0) && (votingStart == 0) && (_startDate + 1000000 > block.timestamp) && (_endDate > _startDate));
        votingEnd = _endDate;
        votingStart = _startDate;
    }

    function getDates() public view returns (uint256,uint256) {
      return (votingStart,votingEnd);
    }
}
