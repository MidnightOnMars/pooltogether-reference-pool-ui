import { ethers } from 'ethers'
import { batch, contract } from '@pooltogether/etherplex'

import PrizePoolAbi from '@pooltogether/pooltogether-contracts/abis/PrizePool'

import { readProvider } from 'lib/utils/getReadProvider'

export const fetchExitFee = async (
  networkName,
  usersAddress,
  prizePoolAddress,
  ticketAddress,
  amount,
) => {
  const provider = await readProvider(networkName)
  const exitFees = {
    credit       : ethers.utils.bigNumberify(0),
    earlyExitFee : ethers.utils.bigNumberify(0),
  }

  try {
    const etherplexPrizePoolContract = contract(
      'prizePool',
      PrizePoolAbi,
      prizePoolAddress
    )

    const values = await batch(
      provider,
      etherplexPrizePoolContract
        .balanceOfCredit(usersAddress, ticketAddress)
        .calculateTimelockDuration(usersAddress, ticketAddress, amount)
        .calculateEarlyExitFee(usersAddress, ticketAddress, amount)
    )

    // Instant Withdrawal Credit/Fee
    exitFees.credit = values.prizePool.balanceOfCredit[0]
    
    exitFees.timelockDurationSeconds = values.prizePool.calculateTimelockDuration.durationSeconds
    exitFees.burnedCredit = values.prizePool.calculateEarlyExitFee.burnedCredit
    exitFees.exitFee = values.prizePool.calculateEarlyExitFee.exitFee
  }
  catch (e) {
    console.warn(e.message)
  }
  finally {
    return exitFees
  }
}
