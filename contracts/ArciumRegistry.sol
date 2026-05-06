// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArciumRegistry {
    event ComputeAttestation(
        address indexed employer,
        bytes32 indexed computeHash,
        uint256 timestamp,
        uint256 employeeCount
    );

    struct Attestation {
        address employer;
        uint256 timestamp;
        uint256 employeeCount;
    }

    mapping(bytes32 => Attestation) public attestations;

    function attest(bytes32 computeHash, uint256 employeeCount) external {
        require(employeeCount > 0, "No employees");
        require(attestations[computeHash].timestamp == 0, "Already attested");
        attestations[computeHash] = Attestation(msg.sender, block.timestamp, employeeCount);
        emit ComputeAttestation(msg.sender, computeHash, block.timestamp, employeeCount);
    }

    function isAttested(bytes32 computeHash) external view returns (bool) {
        return attestations[computeHash].timestamp > 0;
    }

    function getAttestation(bytes32 computeHash)
        external view
        returns (address employer, uint256 timestamp, uint256 employeeCount)
    {
        Attestation storage a = attestations[computeHash];
        return (a.employer, a.timestamp, a.employeeCount);
    }
}
