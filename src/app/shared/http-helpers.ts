import { Response } from '@angular/http';

/** Parse server data to json */
export function parseJson(res: Response) {
  let body = res.json();
  return body;
}

/** Log any errors */
export function handleError(error: Error) {
  let errorMsg = error || 'Server error';
  console.log('error: ', errorMsg);
}