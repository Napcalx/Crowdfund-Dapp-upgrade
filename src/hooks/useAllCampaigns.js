import { useEffect, useState } from "react";
import useCampaignCount from "./useCampaignCount";
import { useConnection } from "../context/connection";
import {
    getCrowdfundContract,
    getCrowdfundContractWithProvider,
} from "../utils";

const useAllCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const { provider } = useConnection();
    const campaignNo = useCampaignCount();

    useEffect(() => {
        const fetchAllCampaigns = async () => {
            try {
                const contract = await getCrowdfundContract(provider, false);
                const campaignsKeys = Array.from(
                    { length: Number(campaignNo) },
                    (_, i) => i + 1
                );
                const campaignPromises = campaignsKeys.map((id) =>
                    contract.crowd(id)
                );

                const contributors = campaignsKeys.map((id) => {
                    const donationResult = contract.getContributors(id);
                    const donationArray = donationResult.toArray();
                    return donationArray;
                })
                

                const campaignResults = await Promise.all(campaignPromises);
                const campaignContributors = await Promise.all(contributors);

                const campaignDetails = campaignResults.map(
                    (details, index) => ({
                        id: campaignsKeys[index],
                        title: details.title,
                        fundingGoal: details.fundingGoal,
                        owner: details.owner,
                        durationTime: Number(details.durationTime),
                        isActive: details.isActive,
                        fundingBalance: details.fundingBalance,
                        contributors: campaignContributors[0],
                    })
                );

                setCampaigns(campaignDetails);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            }
        };

        fetchAllCampaigns();
    }, [campaignNo, provider]);

    useEffect (() => {
        const handleProposeCampaignEvent = (id, title, fundingGoal, durationTime) => {
            const newCampaigns = {
                id, 
                title,
                fundingGoal, 
                durationTime: Number(durationTime),
                fundingBalance: 0,
                contributors: []
            };

            setCampaigns(( previousCampaigns) => [...previousCampaigns, newCampaigns]);
            console.log(newCampaigns);
        };

        const contract = getCrowdfundContractWithProvider(provider);
        contract.on("ProposeCampaign", handleProposeCampaignEvent);

        return () => {
            contract.off("ProposeCampaign", handleProposeCampaignEvent);
        };
    }, [campaigns, provider]);

    return campaigns;
};

export default useAllCampaigns;

