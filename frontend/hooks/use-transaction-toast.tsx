"use client"

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { useWaitForTransactionReceipt } from 'wagmi'
import { TransactionToast } from "@/components/ui/transaction-toast"
import { Loader2 } from "lucide-react"

export function useTransactionToast(
    hash: `0x${string}` | undefined,
    error: Error | null = null
) {
    const { toast } = useToast()
    const [hasCopied, setHasCopied] = useState(false)
    const [pendingToastId, setPendingToastId] = useState<string>()

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
            if (pendingToastId) {
                toast({
                    id: pendingToastId,
                    duration: 0,
                })
            }
            console.log('Transaction error:', error)
            toast({
                title: "Transaction Failed",
                description: error.message || "Transaction failed. Please try again.",
                variant: "destructive",
                duration: 5000,
            })
        }
    }, [error, toast, pendingToastId])

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
            const { id } = toast({
                title: "Transaction Pending",
                description: (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Waiting for confirmation...</span>
                    </div>
                ),
                duration: Infinity,
            })
            setPendingToastId(id)
        }
    }, [isConfirming, toast])

    useEffect(() => {
        if (isSuccess && hash) {
            if (pendingToastId) {
                toast({
                    id: pendingToastId,
                    duration: 0,
                })
            }
            
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
    }, [isSuccess, hash, toast, hasCopied, pendingToastId])

    return { isConfirming, isSuccess }
} 