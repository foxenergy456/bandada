import { useCallback } from "react"
import { AxiosRequestConfig } from "axios"
import { request } from "@zk-groups/utils"
import { Uint248 } from "soltypes"
import { hexStripZeros, toUtf8String } from "ethers/lib/utils"
import { Group } from "../types/groups"

const SUBGRAPH_URL =
    "https://api.thegraph.com/subgraphs/name/semaphore-protocol/goerli-5259d3"

// const SUBGRAPH_URL =
//     "https://cors-anywhere.herokuapp.com/https://api.thegraph.com/subgraphs/name/semaphore-protocol/goerli-5259d3" // avoid CORS error

type ReturnParameters = {
    getOnchainGroupList: (admin: string) => Promise<Group[] | null>
}

export default function useOnchainGroups(): ReturnParameters {
    const getOnchainGroupList = useCallback(
        async (admin: string): Promise<Group[] | null> => {
            try {
                const config: AxiosRequestConfig = {
                    method: "post",
                    data: JSON.stringify({
                        query: `{
                        groups(where: { admin: "${admin}" }) {
                            id
                            admin
                            merkleTree {
                                depth
                            }
                            members {
                                id
                            }
                        }
                    }`
                    })
                }

                const response = await request(SUBGRAPH_URL, config)
                const groups = response.data.groups

                const groupList: Group[] = []
                for (const i in groups) {
                    const uintToBytes = Uint248.from(groups[i].id).toBytes()
                    const groupName = toUtf8String(
                        hexStripZeros(uintToBytes.toString())
                    ).replace(/\0/g, "")
                    const memberList: string[] = []
                    groups[i].members.forEach((member: { id: string }) => {
                        memberList.push(member.id)
                    })
                    groupList.push({
                        id: groups[i].id,
                        name: groupName,
                        description: `${groupName} on-chain group`,
                        treeDepth: groups[i].merkleTree.depth,
                        members: memberList,
                        admin: groups[i].admin
                    })
                }

                return groupList
            } catch (error) {
                console.log(error)
                return null
            }
        },
        []
    )
    return {
        getOnchainGroupList
    }
}
