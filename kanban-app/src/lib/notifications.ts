import { notifications } from '@mantine/notifications';

export function showSuccessNotification(title:string, details: string) {
  notifications.show({
    autoClose: 2000,
    color: 'lime',
    title: title,
    message: details
  });
}

export function showFailureNotification(title:string, details: string) {
  notifications.show({
    autoClose: false,
    color: 'red',
    title: title ? title : 'Unknown error',
    message: details ? details : 'Now error details evailable, check server logs.'
  });
}
