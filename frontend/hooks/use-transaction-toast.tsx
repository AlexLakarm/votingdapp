"use client"

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { useWaitForTransactionReceipt } from 'wagmi'
import { TransactionToast } from "@/components/ui/transaction-toast"

export function useTransactionToast(
    hash: `0x${string}` | undefined,
    error: Error | null = null
) {
    const { toast } = useToast()
    const [hasCopied, setHasCopied] = useState(false)

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setHasCopied(true)
        setTimeout(() => setHasCopied(false), 2000)
    }

    useEffect(() => {
        if (error) {
            console.log('Transaction error:', error)
            toast({
                title: "Transaction Failed",
                description: error.message || "Transaction failed. Please try again.",
                variant: "destructive",
                duration: 5000,
            })
        }
    }, [error, toast])

    useEffect(() => {
        if (hash) {
            toast({
                title: "Transaction Sent",
                description: React.createElement(TransactionToast, {
                    hash,
                    hasCopied,
                    onCopy: copyToClipboard
                }),
                duration: 10000,
            })
        }
    }, [hash, toast, hasCopied])

    useEffect(() => {
        if (isConfirming) {
            toast({
                title: "Transaction Pending",
                description: "Waiting for confirmation...",
            })
        }
    }, [isConfirming, toast])

    useEffect(() => {
        if (isSuccess && hash) {
            toast({
                title: "Transaction Confirmed",
                description: React.createElement('div', {},
                    React.createElement('p', {}, "Transaction confirmed successfully!"),
                    React.createElement(TransactionToast, {
                        hash,
                        hasCopied,
                        onCopy: copyToClipboard
                    })
                ),
                duration: 10000,
            })
        }
    }, [isSuccess, hash, toast, hasCopied])

    return { isConfirming, isSuccess }
} 