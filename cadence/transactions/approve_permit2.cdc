import "EVM"

/// Approves the Permit2 contract to spend stgUSDC on behalf of the COA.
/// This is required before the COA can make x402 payments.
///
/// Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3
/// stgUSDC: 0xF1815bd50389c46847f0Bda824eC8da914045D14
///
transaction(amount: UInt256) {
    let coa: auth(EVM.Call) &EVM.CadenceOwnedAccount

    prepare(signer: auth(BorrowValue) &Account) {
        self.coa = signer.storage.borrow<auth(EVM.Call) &EVM.CadenceOwnedAccount>(
            from: /storage/evm
        ) ?? panic("No COA found. Run setup_coa.cdc first.")
    }

    execute {
        let stgUSDC = "0xF1815bd50389c46847f0Bda824eC8da914045D14"
        let permit2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3"

        let calldata: [UInt8] = EVM.encodeABIWithSignature(
            "approve(address,uint256)",
            [EVM.addressFromString(permit2), amount]
        )

        let result: EVM.Result = self.coa.call(
            to: EVM.addressFromString(stgUSDC),
            data: calldata,
            gasLimit: 100_000,
            value: EVM.Balance(attoflow: 0 as UInt)
        )

        assert(
            result.status == EVM.Status.successful,
            message: "approve() failed: \(result.errorMessage)"
        )
    }
}
