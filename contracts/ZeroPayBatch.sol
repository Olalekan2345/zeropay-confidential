// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZeroPayBatch {
    event BatchPayment(address indexed employer, uint256 totalAmount, uint256 recipientCount);
    event Payment(address indexed recipient, uint256 amount);

    /**
     * @notice Pay multiple employees in one transaction.
     * @param recipients Array of employee wallet addresses.
     * @param amounts    Array of amounts in wei (must match recipients length).
     * Send exactly the sum of amounts as msg.value. Any excess is refunded.
     */
    function batchPay(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable {
        require(recipients.length == amounts.length, "ZeroPay: length mismatch");
        require(recipients.length > 0, "ZeroPay: no recipients");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        require(msg.value >= total, "ZeroPay: insufficient funds sent");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "ZeroPay: zero address");
            (bool ok, ) = recipients[i].call{value: amounts[i]}("");
            require(ok, "ZeroPay: transfer failed");
            emit Payment(recipients[i], amounts[i]);
        }

        // Refund any excess
        uint256 excess = msg.value - total;
        if (excess > 0) {
            (bool refunded, ) = msg.sender.call{value: excess}("");
            require(refunded, "ZeroPay: refund failed");
        }

        emit BatchPayment(msg.sender, total, recipients.length);
    }
}
