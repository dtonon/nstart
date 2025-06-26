# Onboarding integration in Nostr apps

Nstart also offers an onboarding process to external Nostr clients, web and mobile! Taking advantage of this opportunity is simple; just redirect the user to:

```
https://nstart.me?an=<AppName>&at=<web|popup|android|ios>&ac=<returningWebpage|appCode>
```

Where:

`an` is the name of your application;
`at` is the type, from web, android, ios;
`ac` is the returning point, it's a URL for a web application, or the app code for a mobile one;

For example, for a web application:

```
https://nstart.me?an=Coracle&at=web&ac=https://coracle.social
```

and for an Android app:

```
https://nstart.me?an=Volare&at=android&ac=com.fiatjaf.volare
```

The welcome page shows a reference to the calling app:

![Start page](/static/images/apps-integration01.jpg)

At the end of the procedure, instead of the usual finish page, the user will be presented with a customized one:

![Start page](/static/images/apps-integration02.jpg)

When the user presses the "Start using Nostr" button, Nstart sends back to the caller application the available credentials, in this order: bunker, ncryptsec, nsec.

For web apps this happens appending "#nostr-login:\<credentials\> to the URL defined in `ac`, for example:

```
https://coracle.social#nostr-login=bunker://xxxxxxxxxx...
```

An Android app is opened passing an intent using the `nostr-login` scheme:

```
intent:bunker://xxxxxxxxxx...#Intent;scheme=nostr-login;package=com.fiatjaf.com;end;
```

and similarly for an IOS app:

```
damus://bunker://xxxxxxxxxx...
```

The caller app has the responsibility to correctly manage the returning credentials.

## Mandatory note for web application security

The use of `#nostr-login` hash in the url allows the use of a simple GET request while 	maintaining a good security, since the hash is not passed to the server (and so not logged). Nevertheless, the app MUST remove the credentials from the url as soon as possibile so that they cannot remain saved, for example in browser history.
The following is a Javascript code that achieves this goal:

```js
if (window.location.hash && window.location.hash.startsWith('#nostr-login')) {
	const urlWithoutHash = window.location.href.split('#')[0];
	history.replaceState(null, '', urlWithoutHash);
}
```

## Modal option

Web applications have the option to open a modal instead of redirecting; this permits to keep the app state (e.g. when posting a first comment), let the user sign-up, and then resume the flow.

![Modal](/static/images/apps-integration03.jpg)

To do that you have to import a JS from nstart.me and initialize a NstartModal object:

```js
<button id="openBtn">Create a Nostr account</button>

<script src="https://nstart.me/modal.js"></script>
<script>
    // Create the modal instance with required parameters
    const wizard = new NstartModal({
        // Required parameters
        baseUrl: 'https://nstart.me',
        an: 'Great Nostr App', // App name

        // Optional parameters
        aa: '689600' // Hex accent color
        al: 'it', // Language (en, es, it, fr, de, ja)
        am: 'dark' // Force dark mode
        afb: true, // Force bunker (default False)
        asb: true, // Skip bunker (default False)
        aan: true, // Don't return Nsec (default False)
        aac: true, // Don't return  Ncryptsec (default False)
        arr: ['wss://relay.example.com'], // Custom read relays
        awr: ['wss://relay.example.com'], // Custom write relays

        // Callbacks
        onComplete: (result) => {
            console.log('Login token:', result.nostrLogin);
        },
        onCancel: () => {
            console.log('Wizard cancelled');
        }
    });

    document.getElementById('openBtn').onclick = () => wizard.open();
</script>
```

After the followers step, the modal is automatically closed without showing the final screen; it is the application's responsibility to greet the new user and inform him or her that he or she has logged in and can begin exploring the application.

If you prefer, there is also a npm package available at https://www.npmjs.com/package/nstart-modal.

## Popup option

This is an alternative to the modal option, the use of which is suggested for usability reason only if the modal option cannot be applied.
To use the popup instead of "web" use the `at=popup` param when opening it. Nstart will not open the `ac` url you provide, but instead will do `window.opener.location.href=ac + "#nostr-login=..."` to force `hashchange` event on your page. Make sure to specify a random `target` to `window.open` instead of `_blank` so that Nstart has access to `window.opener`, and then listen to `hashchange` event to accept the `#nostr-login=...` return value (and consume it as described above).

## Language

Nstart tries to infer the language from the browser, and eventually fallbacks to English, but you can explicitly set the language with the  `al` param and passing the color language code (en, es, it, fr, de, ja): For example:

```
http://nstart.me/?an=Coracle&al=ja
```

## Dark mode

The modal automatically get correct theme from system, but you can also force it using the `am` param and passing `light` or `dark`. For example:

```
http://nstart.me/?an=Coracle&am=dark
```

## Accent color

You can overwrite Nstart accent with a custom one using the `aa` param and passing the hex color code. For example:

```
http://nstart.me/?an=Coracle&aa=fc560e
```

## Custom relays

While Nstart creates a 10002 event with random picked relays from a selected pool by default , apps can overwrite these read and write relays using the `arr` (read relays) and `awr` (write relays) params. More relays can be passed, separated by commas. For example:

```
http://nstart.me/?an=Coracle&at=web&ac=https://coracle.social&arr=wss://relay.damus.io&awr=wss://nos.lol,wss://wss://offchain.pub
```

## Force the multi-signature bunker

Some apps only accept login via bunker. They can force this specific step (the user can't deselect it) using the `afb=yes` param. For example:

```
https://nstart.me?an=Coracle&at=web&ac=https://coracle.social&afb=yes
```

## Skip the multi-signature bunker

Some apps are not ready to manage the multi-signature bunker, or cannot fully take advantage of it since it does not support encryption (e.g. DMs). They can hide this specific step using the `asb=yes` param. For example:

```
https://nstart.me?an=Coracle&at=web&ac=https://coracle.social&asb=yes
```

## Skip the follows suggestions

Some apps may prefer to handle the suggestion of a list of first contacts using an internal procedure. They can hide this final step using the `asf=yes` param. For example:

```
https://nstart.me?an=Coracle&at=web&ac=https://coracle.social&asf=yes
```

## Disable returning the plain nsec

Some apps do not support login by nsec or may prefer not to handle unencrypted credential for security reasons. With the param `aan=yes` you can force that; in this case the credential passed back will be `null`. For example:

```
https://nstart.me?an=Coracle&at=web&ac=https://coracle.social&aan=yes
```

## Disable returning the ncryptsec

Some apps do not support login by ncryptsec or may prefer not to handle also encrypted credential for security reasons. With the param `aac=yes` you can force that; in this case the credential passed back will be the nsec (if `aan` is not set a `yes`, otherwise `null` in returned). For example:

```
https://nstart.me?an=Coracle&at=web&ac=https://coracle.social&aac=yes
```
