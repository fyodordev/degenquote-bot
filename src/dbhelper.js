const NeDB = require('nedb');

class DbHelper {
    constructor(filename) {
        this.filename = filename;
        this.quotes = { _id: 'quotes' };
        this.users = { _id: 'users' };
    }

    load(callback) {
        this.database = new NeDB({ filename: this.filename, autoload: true });
        this.database.find({ _id: 'quotes' }, (q_err, q_docs) => {
            if (q_docs.length === 0)
                this.database.insert(this.quotes);
            else
                this.quotes = q_docs[0];

            this.database.find({ _id: 'users' }, (s_err, s_docs) => {
                if (s_docs.length === 0)
                    this.database.insert(this.users);
                else
                    this.users = s_docs[0];

                if (callback)
                    callback();
            });
        });
    }

    saveQuote(quoteId, text, date, userId) {
        if (!this.quotes.hasOwnProperty(quoteId)) {
            this.quotes[quoteId] = {
                id: quoteId,
                text: text,
                date: date,
                user: userId
            };

            if (this.users[userId])
                this.users[userId].quotes++;

            this.updateUserInDB(userId);
            this.updateQuoteInDB(quoteId);


            return true;
        }
        else
            return false;
    }

    removeQuote(quoteId) {
        if (!this.quotes.hasOwnProperty(quoteId))
            return false;

        let userId = this.quotes[quoteId].user;
        this.users[userId].quotes--;

        this.updateUserInDB(userId);

        let quoteObj = {};
        quoteObj[quoteId] = this.quotes[quoteId];
        this.database.update({ _id: this.quotes._id }, { $unset: quoteObj });

        delete this.quotes[quoteId];

        return true;
    }

    checkOrCreateUser(userId, username, firstName) {
        if (!this.users.hasOwnProperty(userId)) {
            this.users[userId] = {
                id: userId,
                username: username,
                first_name: firstName,
                quotes: 0
            };

            this.updateUserInDB(userId);

            return true;
        }
        else {
            if (this.users[userId].username != username || this.users[userId].first_name != firstName) {
                this.users[userId].username = username;
                this.users[userId].first_name = firstName;
                this.updateUserInDB(userId);
            }
            return false;
        }
    }

    updateUserInDB(userId) {
        this.updateInDB('users', this.users, userId);
    }

    updateQuoteInDB(quoteId) {
        this.updateInDB('quotes', this.quotes, quoteId);
    }

    updateInDB(_id, container, objId) {
        let dbObj = {};
        dbObj[objId] = container[objId];

        this.database.update({ _id: _id }, { $set: dbObj });
    }
}

module.exports = DbHelper;