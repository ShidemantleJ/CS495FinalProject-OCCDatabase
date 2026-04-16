import { useState, useCallback, useEffect } from 'react';
import { databaseAPI } from '../api';
import ReassignChurchesModal from '../components/ReassignChurchesModal';

export function useMemberRetirement() {
    const [modalState, setModalState] = useState({ isOpen: false });
    const [isProcessing, setIsProcessing] = useState(false);

    const initiateRetirement = useCallback(async (member, { onConfirm, onCancel, actionLabel = "Retire" }) => {
        setIsProcessing(true);

        const currentYear = new Date().getFullYear();
        const { data: attrs, error: attrsError } = await databaseAPI.list("church_annual_attributes", {
            select: `id, church_id, year, shoebox_count, church2 (id, church_name)`,
            filters: [
                { column: "relations_member", op: "eq", value: member.id },
                { column: "year", op: "eq", value: currentYear }
            ]
        });

        if (attrsError) {
            alert("Error checking for church assignments: " + attrsError.message);
            setIsProcessing(false);
            return;
        }

        if (attrs && attrs.length > 0) {
            const { data: members, error: membersError } = await databaseAPI.list("team_members", {
                select: "id, first_name, last_name",
                filters: [{ column: "active", op: "eq", value: true }],
                orderBy: { column: "last_name", ascending: true }
            });

            if (membersError) {
                alert("Error fetching active members: " + membersError.message);
                setIsProcessing(false);
                return;
            }

            setModalState({
                isOpen: true,
                churches: attrs,
                activeMembers: members.filter(m => m.id !== member.id),
                onConfirmCallback: onConfirm,
                onCancelCallback: onCancel,
                actionLabel,
            });
            setIsProcessing(false);
        } else {
            // No churches, just confirm immediately.
            await onConfirm();
            setIsProcessing(false);
        }
    }, []);

    const RetirementModal = () => {
        const [reassignments, setReassignments] = useState({});

        useEffect(() => {
            if (modalState.isOpen) {
                const initial = modalState.churches.reduce((acc, attr) => ({ ...acc, [attr.id]: "" }), {});
                setReassignments(initial);
            }
        }, [modalState.isOpen, modalState.churches]);

        const handleConfirm = async () => {
            setIsProcessing(true);
            const updates = modalState.churches.map(attr => ({ id: attr.id, relations_member: reassignments[attr.id] || null }));
            if (updates.length > 0) {
                await databaseAPI.upsert("church_annual_attributes", updates);
            }
            setModalState({ isOpen: false });
            if (modalState.onConfirmCallback) {
                await modalState.onConfirmCallback();
            }
            setIsProcessing(false);
        };

        const handleCancel = () => {
            setModalState({ isOpen: false });
            if (modalState.onCancelCallback) {
                modalState.onCancelCallback();
            }
        };

        return (
            <ReassignChurchesModal
                isOpen={modalState.isOpen}
                churches={modalState.churches}
                activeMembers={modalState.activeMembers}
                reassignments={reassignments}
                onChange={(attrId, memberId) => setReassignments(prev => ({ ...prev, [attrId]: memberId }))}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                currentYear={new Date().getFullYear()}
                isProcessing={isProcessing}
                actionLabel={modalState.actionLabel}
            />
        );
    };

    return { initiateRetirement, RetirementModal, isProcessing };
}