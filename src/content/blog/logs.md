---
author: Baptiste Marlet
pubDatetime: 2024-04-12T14:00:00Z
title: On my love of logs — A love letter to monitoring
postSlug: on-my-love-of-logs-a-love-letter-to-monitoring
featured: true
draft: true
tags:
  - tech
  - monitoring
ogImage: ""
description: This post is a personal rambling on logs, why I love them, and mostly how I use them to debug software.
---

## Table of contents

## Introduction

How many times did you launch an app only for it not to work? You click the icon, you wait, and
nothing happens. No loading screen, no indicator that something happens. So you run commands like
`ps` or `procs` to ensure it is _actually_ launching… and nothing. Maybe you made a typo in your
`grep` command, so you try again, but to no avail.

At that moment, you want to know what happens. You find the binary on your computer or you type the
name of the command in your terminal, and there you see them. Sweet, sweet logs. And suddenly,
error, and the command fails. Finally you know: nothing could happen, since it _failed_. But now you
know why. You have logs, you know what worked, and you potentially have a traceback, telling you
_where_ it failed.

There, several things can happen. Depending on what failed, you can try downgrading packages to come
back to the last stable version, or you send a detailed bug report, or whatever you can do at this
stage.

So logs are helpful, sure, we all knew that. Now the problem is, I work in software development. I'm
not only sending reports with error logs, I'm also getting some. Which means that I have to be able
to use them. I also keep on eye on logs, traces and metrics in our apps, so that I can anticipate
bugs.

## Anticipating issues thanks to monitoring

The first part I'll detail is how we can anticipate issues with monitoring. Whichever stack you have
to monitor your application (tools like [Grafana](https://grafana.com/),
[Sentry](https://sentry.io/welcome/), or all the other that exist), you will find yourself in a
position where, somewhere, you can see logs, errors, metrics and traces of your services.

Examples of those might be API call traces, detailed with database call time, serialization time,
logs with the status code, the request and response headers, the IP of the call, and all the other
possible logs you can imagine. With those, you will have logs and metrics about recurring tasks,
including how long they take to run, the number of time they are triggered, the number of objects
they process, and so on.

Basically, you have lots of data, and you put it somewhere to keep an eye on it. And you know your
objectives. Maybe you have service level agreements (SLA) for your API response time, and you can
compare the reality with your objectives. Or you know that you have that trigger itself every hour,
and you need to know if its execution time goes higher than 45 minutes, so you have time to optimize
it or change the way it works before it becomes too late.

All those data will help you notice issues in production, but we want to anticipate those, and avoid
them if we can. To do so, you put the exact same monitoring stack for your testing and development
environments. There, you can begin studying them, and detect trends.

If you know a task needs 1 minutes to process 1 thousand objects, that the task length is more or
less linear, and you have 15 thousand objects in production, you can estimate that the same task
will need 15 minutes to run in production. Which might be acceptable, or not, depending on what the
task does and when it is supposed to run.

You can also notice that some processes slow the API calls due to locks being taken in the database
or due to the computation that run in the database during those processes, and those tasks, while
lasting only a few seconds at worst in your testing environment, might last up to 2 or 3 minutes in
production. And if you know that during the process, the API calls get slowed by 10%, you can
anticipate it so that you continue reaching your SLA despite that.

With all of those metrics, traces and logs, you can have a good idea of what the production
conditions will be, and on what you will need to focus your efforts in the future.

Obviously, having all that observability in your testing environments will also help you detect bugs
you hadn't anticipated before they reach production, so that you can fix them before it is too late.

## Solving problems with monitoring

Then come a time where the bug wasn't anticipated as expected. The bug happened, hopefully in a
testing environment. This bugs gives me two strange logs. One leading to a traceback, the other not.
But both of them lead to an unexpected situation. The easy case is the traceback. I know what was
missing, which line triggered the error, how I can fix that. I can write a test to reproduce that,
understand what failed, and fix it properly.

The second case is the hardest. The code failed. The process started as it should have, but
somewhere, it didn't follow the nominal case, and I have a warning log, then the process failed.
Nothing critical, no hard traceback: just a failure, such as a very wrong result in a computation,
or a loop that wasn't triggered as it should have.

So it failed, but I am not blind. I have logs. I can, hopefully, find what happened. Well, let's
try to understand it.

Let's assume we have the following logs, here presented in two formats: short, to help reading, and
structured in JSON, which is closer to what I would find in a real situation.

```plaintext
[INFO] [2024-04-12T10:00:00.000Z] [<UUID>] process start
[INFO] [2024-04-12T10:00:00.012Z] [<UUID>] object found, object_id=42
[INFO] [2024-04-12T10:00:00.043Z] [<UUID>] calculation complete, object_id=42, result=100
[WARNING] [2024-04-12T10:00:00.050Z] [<UUID>] no process to launch, object_id=42
```

```json
{"level": "info", "timestamp": "2024-04-12T10:00:00.000Z", "message": "process start", "correlation_id": <UUID>}
{"level": "info", "timestamp": "2024-04-12T10:00:00.012Z", "message": "object found", "correlation_id": <UUID>, "object_id": 42}
{"level": "info", "timestamp": "2024-04-12T10:00:00.043Z", "message": "calculation complete", "correlation_id": <UUID>, "object_id": 42, "result": 100}
{"level": "warning", "timestamp": "2024-04-12T10:00:00.050Z", "message": "no process to launch", "correlation_id": <UUID>, "object_id": 42}
```

I have my logs, and some details. Real logs could potentially be more detailed, but this will do for
the example. Just a precision, what I called `correlation_id` here could have several names, the
only objective is to have an idea that is similar for the whole process, so that we can have all the
details about a specific process by searching it.

With those logs, the first thing I usually do at this stage is to `grep` the code for the different
messages. Here, the warning is especially interesting, so something like `rg "no process to launch"`
would be telling of what happened. From there, I can get details about what triggers this situation.
Maybe we only get here if the result of the previous computation is higher than 50. But we know that
our result is 100.

This brings the next question: was this result expected? Or should we have had something else, like
40, which would have triggered the next process? For the needs of this test, let's assume that was
what should have happened.

So I go to the computation, checks what should have happened. Depending on the computation that is
being done, I can run it manually, or create a test with an object that have the same initial data.
And I check, step by step, what happens. Until I find the stage with the wrong result. Maybe I
wanted to multiply a parameter by 100, and instead of `parameter * FACTOR` in the code, I wrote
`FACTOR`. Which can seem a trivial error, but experience tells me those usually are the more common.

And with that, I used the logs I had to fix the error, and everything will be fine… until the next
bug.

## A word on helpful logs

I'd like to add a word on what makes logs helpful, whether for giving indications, or for fixing a
bug. Structured logging has already been discussed a lot on the internet, on several blog posts, so
I won't detail it here. I will just write about what makes logs useful.

Ideally, you want to be able to know where to search for a bug when you have a log. This means each
log should give indications on what triggered it. If I take my previous example, the logs are bad:
we have no idea which process started, in which scope we find ourselves. A better log could be
something along the line of: `[APPLICATION][ALGORITHM NAME] process start`. Another could be
`application.algorithm.process_start`. With those two, we have _context_, and know what was
happening around potential warnings or errors.

Another point is the string itself, or why `object found, object_id=42` is better than `object 42
found`, despite not being structured. When you have your log, you want to be able to search the line
that triggered it in your codebase. Which means you want to run `grep` on a specific string, and not
on something that can change. If your log is `object 42 found`, is 42 a variable that was defined
before? The value of `object.id`? Something else? You would have to run something like `rg "object
.+ found"` to find your log, which could lead to several possible lines. On the other hand, if your
log is `object found, object_id=42`, you can run `rg "object found"`, and find the occurrence you're
searching for, easily.

Finally, give as much indications as you might need later. In the previous example, we log the
result of the computation, but we do not run any parameter. In production, you might not have a way
to access the object and its parameters. Log them. Get them in logs, so that you can create the same
objects in unit tests to solve the bug in the future.

## Conclusion

As the length of those ramblings might indicate, I love monitoring. Useful logs are not only helpful
for monitoring an application, but also to debug it when bugs might be encountered.

So, please, write logs, and write useful logs.
