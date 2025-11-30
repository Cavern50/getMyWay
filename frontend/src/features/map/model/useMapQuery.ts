import { meetingApi, type Meeting } from '@/features/map/api/meetingApi'
import { useMutation, useQuery, useQueryClient } from 'vue-query'




export const useMeeting = (meetingId: string | null) =>
    useQuery<Meeting | null>({
        queryKey: ['meeting', meetingId],
        queryFn: () => meetingId ? meetingApi.getMeetingByLink(meetingId) : Promise.resolve(null),
        enabled: !!meetingId,             // запрос только если есть id
        staleTime: 60_000,                // держим кэш минуту
    });

export const useCreateMeeting = () => {
    const queryClient = useQueryClient();

    return useMutation<Meeting, Error, Parameters<typeof meetingApi.createMeeting>[0]>({
        mutationFn: meetingApi.createMeeting,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['meeting', data._id]); // если надо подтянуть свежие данные
        },
    });
};

export const useJoinMeeting = () => {
    const queryClient = useQueryClient();
    return useMutation<Meeting, Error, Parameters<typeof meetingApi.joinMeeting>[0]>({
        mutationFn: meetingApi.joinMeeting,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['meeting', data._id]);
        },
    });
}